"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import styles from "../page.module.css";

type FeatureIcon = "shield" | "trending" | "wallet";

type Feature = {
    accent: string;
    description: string;
    icon: FeatureIcon;
    title: string;
};

type LandingFeatureGridProps = {
    items: Feature[];
};

const iconMap = {
    shield: ShieldCheck,
    trending: TrendingUp,
    wallet: Wallet,
} satisfies Record<FeatureIcon, typeof Wallet>;

export default function LandingFeatureGrid({ items }: LandingFeatureGridProps) {
    const [isVisible, setIsVisible] = useState(false);
    const gridRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const node = gridRef.current;

        if (!node) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "0px 0px -12% 0px", threshold: 0.18 }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={gridRef} className={styles.featureGrid}>
            {items.map(({ title, description, accent, icon }, index) => {
                const Icon = iconMap[icon];

                return (
                    <article
                        key={title}
                        className={`${styles.featureCard} ${isVisible ? styles.featureCardVisible : ""}`}
                        style={{ "--feature-delay": `${index * 140}ms` } as CSSProperties}
                    >
                        <span className={styles.featureIcon}>
                            <Icon size={20} />
                        </span>
                        <span className={styles.featureAccent}>{accent}</span>
                        <h3>{title}</h3>
                        <p>{description}</p>
                    </article>
                );
            })}
        </div>
    );
}
