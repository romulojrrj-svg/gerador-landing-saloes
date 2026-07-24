"use client";

import { useId, useState } from "react";
import type { SalonFaqItem } from "@/types/salon";
import styles from "./premium-editorial-v2.module.css";

export function PremiumFaq({ items }: { items: SalonFaqItem[] }) {
  const instanceId = useId().replace(/:/g, "");
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <div className={styles.faqList}>
        {items.map((item) => {
          const open = item.id === openId;
          const safeId = item.id.replace(/[^a-zA-Z0-9_-]/g, "-");
          const buttonId = `${instanceId}-${safeId}-button`;
          const panelId = `${instanceId}-${safeId}-panel`;

          return (
            <article key={item.id} className={styles.faqItem}>
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  className={styles.faqButton}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() =>
                    setOpenId((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                >
                  <span className={styles.faqQuestion}>{item.question}</span>
                  <span className={styles.faqIcon} aria-hidden="true" />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                aria-hidden={!open}
                className={styles.faqAnswerGrid}
                data-open={open}
              >
                <div className={styles.faqAnswerClip}>
                  <p className={styles.faqAnswer}>{item.answer}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <noscript>
        <style>{`.${styles.faqList}{display:none!important}`}</style>
        <div className={styles.faqFallback}>
          {items.map((item) => (
            <article key={item.id} className={styles.faqFallbackItem}>
              <h3 className={styles.faqFallbackQuestion}>{item.question}</h3>
              <p className={styles.faqFallbackAnswer}>{item.answer}</p>
            </article>
          ))}
        </div>
      </noscript>
    </>
  );
}
