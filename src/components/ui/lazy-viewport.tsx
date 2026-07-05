import React, { useState, useEffect, useRef } from "react";

interface LazyViewportProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  height?: string | number;
  className?: string;
  rootMargin?: string;
  threshold?: number;
}

export const LazyViewport: React.FC<LazyViewportProps> = ({
  children,
  fallback,
  height = "auto",
  className = "",
  rootMargin = "150px 0px", // Preload slightly before it enters the viewport
  threshold = 0.01,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If browser doesn't support IntersectionObserver, render eagerly
    if (!window.IntersectionObserver) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  const style: React.CSSProperties = !isVisible && height !== "auto"
    ? { minHeight: typeof height === "number" ? `${height}px` : height }
    : {};

  return (
    <div ref={containerRef} style={style} className={className}>
      {isVisible ? (
        <div className="animate-fade-in transition-all duration-300 ease-out transform opacity-100 translate-y-0">
          {children}
        </div>
      ) : (
        fallback || (
          <div 
            className="w-full bg-slate-100/50 dark:bg-slate-800/40 rounded-2xl animate-pulse"
            style={{ height: height === "auto" ? "150px" : height }}
          />
        )
      )}
    </div>
  );
};

export default LazyViewport;
