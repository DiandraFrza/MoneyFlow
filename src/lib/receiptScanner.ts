/** @format */

export type CategoryHint = "Makanan" | "Belanja" | "Transportasi" | "Tagihan" | "Lainnya";

export interface ScannedReceipt {
  merchant: string;
  amount: number;
  date: string; // YYYY-MM-DD
  itemsSummary: string;
  categoryHint: CategoryHint;
}

// Urutan fallback: kalau satu model 404 / tidak tersedia, otomatis coba berikutnya.
const MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const PROMPT = `Kamu adalah pembaca struk/nota belanja Indonesia.
Baca gambar struk dan kembalikan data dalam JSON dengan field:
- merchant: nama toko/merchant (string, "Tidak diketahui" jika tidak ada)
- amount: TOTAL akhir yang dibayar dalam Rupiah, angka bulat tanpa titik/koma (number). Ambil "Total"/"Grand Total"/"Total Bayar", bukan subtotal atau uang tunai/kembalian.
- date: tanggal transaksi format YYYY-MM-DD (string, kosong jika tidak terbaca)
- itemsSummary: ringkasan singkat item yang dibeli, maksimal 80 karakter (string)
- categoryHint: salah satu dari "Makanan", "Belanja", "Transportasi", "Tagihan", "Lainnya"`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    merchant: { type: "STRING" },
    amount: { type: "NUMBER" },
    date: { type: "STRING" },
    itemsSummary: { type: "STRING" },
    categoryHint: { type: "STRING", enum: ["Makanan", "Belanja", "Transportasi", "Tagihan", "Lainnya"] },
  },
  required: ["merchant", "amount", "date", "itemsSummary", "categoryHint"],
};

const getApiKey = (): string | undefined => {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem("mf_gemini_api_key") : null;
  return stored || (import.meta.env.VITE_GEMINI_API_KEY as string | undefined);
};

/** Perkecil gambar & ubah ke base64 JPEG supaya request ringan dan cepat. */
const imageToBase64 = (file: File, maxDimension = 1600, quality = 0.8): Promise<{ mimeType: string; data: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Gagal membaca gambar."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas tidak didukung browser ini."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({ mimeType: "image/jpeg", data: dataUrl.split(",")[1] });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

const todayISO = () => new Date().toISOString().split("T")[0];

const normalize = (raw: Partial<ScannedReceipt>): ScannedReceipt => {
  const amount = Math.round(Number(String(raw.amount ?? 0).replace(/[^0-9.]/g, "")) || 0);
  const date = typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : todayISO();
  const allowed: CategoryHint[] = ["Makanan", "Belanja", "Transportasi", "Tagihan", "Lainnya"];
  const categoryHint = allowed.includes(raw.categoryHint as CategoryHint) ? (raw.categoryHint as CategoryHint) : "Lainnya";

  return {
    merchant: (raw.merchant || "Tidak diketahui").toString().trim(),
    amount,
    date,
    itemsSummary: (raw.itemsSummary || "").toString().trim().slice(0, 120),
    categoryHint,
  };
};

const parseJson = (text: string): Partial<ScannedReceipt> => {
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Respon AI tidak bisa dibaca. Coba foto struk yang lebih jelas.");
  }
};

export async function scanReceiptWithAI(file: File): Promise<ScannedReceipt> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key Gemini belum diatur.");
  }

  const { mimeType, data } = await imageToBase64(file);

  const body = {
    contents: [
      {
        parts: [{ text: PROMPT }, { inlineData: { mimeType, data } }],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  let lastError = "Gagal menghubungi AI.";

  for (const model of MODELS) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Key lewat header, bukan di URL, jadi tidak muncul di log/console error.
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error("Tidak ada koneksi internet atau request diblokir. Coba lagi.");
    }

    if (res.ok) {
      const json = await res.json();
      const text: string | undefined = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
      if (!text) {
        const reason = json?.promptFeedback?.blockReason;
        throw new Error(reason ? `Gambar ditolak AI (${reason}).` : "AI tidak mengembalikan hasil. Coba foto yang lebih jelas.");
      }
      const result = normalize(parseJson(text));
      if (result.amount <= 0) {
        throw new Error("Total belanja tidak terbaca. Coba foto struk yang lebih jelas dan rata.");
      }
      return result;
    }

    const errJson = await res.json().catch(() => null);
    const apiMsg: string = errJson?.error?.message || res.statusText || "";

    // Model tidak ada/tidak didukung -> coba model berikutnya
    if (res.status === 404) {
      lastError = `Model ${model} tidak tersedia (404).`;
      continue;
    }
    // Kuota habis / terlalu banyak request
    if (res.status === 429) {
      throw new Error("Kuota Gemini habis atau terlalu banyak request. Tunggu sebentar lalu coba lagi.");
    }
    // Key bermasalah
    if (res.status === 400 && /api key/i.test(apiMsg)) {
      throw new Error("API Key tidak valid. Periksa kembali API Key Gemini kamu.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`API Key ditolak (${res.status}). Pastikan key valid dan Generative Language API aktif. ${apiMsg}`);
    }
    // Server Google sedang sibuk -> coba model berikutnya
    if (res.status >= 500) {
      lastError = `Server AI sedang bermasalah (${res.status}).`;
      continue;
    }

    throw new Error(`Gagal menghubungi AI (${res.status}): ${apiMsg}`);
  }

  throw new Error(lastError);
}
