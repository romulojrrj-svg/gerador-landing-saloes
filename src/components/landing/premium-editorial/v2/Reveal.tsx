"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./premium-editorial-v2.module.css";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "fade" | "image";
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "fade",
}: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (
      !element ||
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const bounds = element.getBoundingClientRect();

    element.dataset.enhanced = "true";

    if (bounds.top <= window.innerHeight * 0.9) {
      element.dataset.visible = "true";
      return;
    }

    element.dataset.visible = "false";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        element.dataset.visible = "true";
        observer.disconnect();
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      className={`${styles.reveal} ${className}`.trim()}
      data-enhanced="false"
      data-visible="true"
      data-variant={variant}
      style={{ "--pe2-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
