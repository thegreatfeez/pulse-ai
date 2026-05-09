import type { CSSProperties } from "react";
import styles from "../page.module.css";

type LandingHeroHeadingProps = {
    accentText?: string;
    text: string;
};

export default function LandingHeroHeading({ text, accentText }: LandingHeroHeadingProps) {
    let letterIndex = 0;
    const accentStart = accentText ? text.indexOf(accentText) : -1;
    const accentEnd = accentStart >= 0 && accentText ? accentStart + accentText.length : -1;

    const renderSegment = (segmentText: string, isAccent = false) =>
        segmentText.split(/(\s+)/).map((token, tokenIndex) => {
            if (!token) {
                return null;
            }

            if (/^\s+$/.test(token)) {
                return (
                    <span key={`space-${isAccent ? "accent" : "base"}-${tokenIndex}`} className={styles.heroHeadlineSpace}>
                        {token.replace(/ /g, "\u00A0")}
                    </span>
                );
            }

            return (
                <span
                    key={`word-${isAccent ? "accent" : "base"}-${tokenIndex}-${token}`}
                    className={styles.heroHeadlineWord}
                >
                    {Array.from(token).map((letter) => {
                        const currentLetterIndex = letterIndex;
                        letterIndex += 1;

                        return (
                            <span
                                key={`${tokenIndex}-${currentLetterIndex}-${letter}`}
                                className={`${styles.heroHeadlineLetter} ${isAccent ? styles.heroHeadlineLetterAccent : ""}`}
                                style={{ "--hero-letter-delay": `${currentLetterIndex * 0.03}s` } as CSSProperties}
                            >
                                {letter}
                            </span>
                        );
                    })}
                </span>
            );
        });

    return (
        <h1 aria-label={text}>
            <span className={styles.heroHeadline} aria-hidden="true">
                {accentStart >= 0 && accentEnd >= 0 ? (
                    <>
                        {renderSegment(text.slice(0, accentStart))}
                        {renderSegment(text.slice(accentStart, accentEnd), true)}
                        {renderSegment(text.slice(accentEnd))}
                    </>
                ) : (
                    renderSegment(text)
                )}
            </span>
        </h1>
    );
}
