"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import styles from "../page.module.css";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  stat: string;
  image?: string;
};

type LandingTestimonialsProps = {
  items: Testimonial[];
};

export default function LandingTestimonials({ items }: LandingTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const showNext = useEffectEvent(() => {
    setActiveIndex((current) => (current + 1) % items.length);
  });

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      showNext();
    }, 5500);

    return () => window.clearInterval(intervalId);
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  const activeItem = items[activeIndex];
  const initials = activeItem.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className={styles.testimonialSection}>
      <div className={styles.testimonialIntro}>
        <span className={styles.sectionEyebrow}>User testimony</span>
        <h2>People stick with Stash because it feels easier than the usual stablecoin tools.</h2>
      </div>

      <div className={styles.testimonialShell}>
        <button
          type="button"
          className={`${styles.testimonialButton} ${styles.testimonialButtonLeft}`}
          onClick={() =>
            setActiveIndex((current) => (current - 1 + items.length) % items.length)
          }
          aria-label="Show previous testimony"
        >
          <ChevronLeft size={18} />
        </button>

        <div className={styles.testimonialCard}>
          <div className={styles.testimonialQuoteMark}>
            <Quote size={20} />
          </div>

          <p className={styles.testimonialQuote}>{activeItem.quote}</p>

          <div className={styles.testimonialMeta}>
            <div className={styles.testimonialIdentity}>
              <div className={styles.testimonialAvatar}>
                {activeItem.image ? (
                  <Image
                    src={activeItem.image}
                    alt={activeItem.name}
                    width={56}
                    height={56}
                    className={styles.testimonialAvatarImage}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div>
                <strong>{activeItem.name}</strong>
                <span>{activeItem.role}</span>
              </div>
            </div>
            <div className={styles.testimonialStat}>{activeItem.stat}</div>
          </div>
        </div>

        <button
          type="button"
          className={`${styles.testimonialButton} ${styles.testimonialButtonRight}`}
          onClick={() => setActiveIndex((current) => (current + 1) % items.length)}
          aria-label="Show next testimony"
        >
          <ChevronRight size={18} />
        </button>

        <div className={styles.testimonialDots} aria-label="Testimony selector">
          {items.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={
                index === activeIndex
                  ? `${styles.testimonialDot} ${styles.testimonialDotActive}`
                  : styles.testimonialDot
              }
              onClick={() => setActiveIndex(index)}
              aria-label={`Show testimony from ${item.name}`}
              aria-pressed={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
