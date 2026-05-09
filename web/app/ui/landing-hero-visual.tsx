"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../page.module.css";

type HeroImage = {
    alt: string;
    position?: string;
    src: string;
};

type LandingHeroVisualProps = {
    images: HeroImage[];
};

export default function LandingHeroVisual({ images }: LandingHeroVisualProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) {
            return;
        }

        const interval = window.setInterval(() => {
            setActiveIndex((currentIndex) => (currentIndex + 1) % images.length);
        }, 3000);

        return () => window.clearInterval(interval);
    }, [images.length]);

    return (
        <div className={styles.heroPhotoCard}>
            <div className={styles.heroPhotoStage}>
                {images.map((image, index) => (
                    <div
                        key={image.src}
                        className={`${styles.heroImageSlide} ${index === activeIndex ? styles.heroImageSlideActive : ""}`}
                        aria-hidden={index !== activeIndex}
                    >
                        <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            className={styles.heroImage}
                            priority={index === 0}
                            quality={95}
                            sizes="(max-width: 720px) 100vw, (max-width: 980px) 80vw, 32rem"
                            style={{ objectPosition: image.position ?? "center 24%" }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
