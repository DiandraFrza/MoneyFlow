<!-- @format -->

# 🎨 Design System: MoneyFlow Pro

**Style Direction:** 01. Swiss Style / Minimalism

## 1. Core Philosophy

Fokus utama pada struktur murni dan hierarki konten. Menghilangkan semua elemen dekoratif (bayangan, gradasi, sudut membulat) untuk menonjolkan data keuangan melalui sistem grid yang ketat, _whitespace_ yang luas, dan tipografi raksasa.

## 2. Color Palette

Menggunakan palet monokromatik dengan kontras tinggi, dipadukan dengan aksen warna hangat dari palet "July" untuk elemen interaktif dan penekanan data penting.

**Base & Structure (High Contrast):**

- **Background (Primary):** `#f4f4f4f4` (Pure White)
- **Background (Secondary):** `#fafafa` (Off-White, untuk pemisah seksi)
- **Text & Borders:** `#1e1e1e` (Pitch Black)

**Brand Accents (July Palette):**

- **Primary Accent:** `#ff5722` (Smashing Pumpkins) - Digunakan untuk tombol utama (Call to Action), status aktif, atau angka total saldo yang besar.
- **Hover/Light Accents:** `#ff8a65` (Salmon Nigiri) & `#ff7043` (Precious Persimmon).
- **Deep/Active States:** `#f4511e` (Fiery Glow) & `#e64a19` (Crunchy Carrot).

## 3. Typography

Menggunakan font _grotesque sans-serif_ yang berkarakter untuk memperkuat nuansa majalah/editorial asimetris.

- **Primary Font:** `Space Grotesk`, `Syne`, atau `Inter`.
- **Headings:** Ukuran sangat besar (massive typography), _bold_, dan dominan (contoh: `text-6xl` atau `text-8xl` pada Tailwind).
- **Body/Data:** Sangat rapi, _legible_, dengan kontras ketebalan (weight) yang jelas antara label dan nilai uang.

## 4. Layout & Grid System

- **Rigid Grid:** Tata letak harus mengikuti garis grid yang presisi. Penggunaan garis grid yang terlihat (_visible grid lines_) sangat dianjurkan.
- **Asymmetry:** Hindari _centering_ tradisional. Gunakan tata letak asimetris yang dinamis dengan pembagian kolom yang tegas.
- **Whitespace:** Berikan jarak yang sangat luas antar elemen agar desain bisa "bernapas" dan data tidak terlihat sesak.

## 5. UI Elements & Components

**Aturan Mutlak:** TIDAK ADA bayangan (box-shadow), TIDAK ADA gradasi, dan TIDAK ADA sudut membulat (border-radius).

- **Borders:** Gunakan garis tipis (`border-width: 1px`, `border-color: #1e1e1e`) pada semua sisi _card_, _input_, dan pembatas area.
- **Corners:** Sudut tajam 90 derajat (`rounded-none`).
- **Buttons:**
  - Bentuk persegi kaku.
  - Warna solid (hitam atau `#ff5722`).
  - Efek _hover_ menggunakan inversi warna (misal: tombol hitam berubah menjadi putih dengan teks hitam, atau batas tepi menebal menjadi `2px`).
- **Cards (Dashboard/Widgets):** Wadah datar transparan dengan batas tepi (border) hitam 1px.
- **Modals (CRUD Config):** Tampil sebagai lapisan _overlay_ kaku dengan batas tepi hitam yang tebal, menggunakan tipografi judul yang mendominasi seluruh ruang atas modal.
