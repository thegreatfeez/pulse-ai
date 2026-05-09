"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useWallet } from "@/app/context/WalletContext";
import styles from "../page.module.css";
import { ConnectButton } from "@/components/shared/connect-button";

export default function LandingHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { isConnected } = useWallet();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <header className={styles.navbar}>
            <Link href="/" className={styles.brand}>
                <span className={styles.brandMark}>S</span>
                <span>Stash</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className={`${styles.navActions} ${isOpen ? styles.navActionsOpen : ''}`}>
                    {isConnected && (
                        <Link href="/dashboard/overview" className={styles.navLink} onClick={() => setIsOpen(false)}>
                            Dashboard
                        </Link>
                    )}
                    <span onClick={() => setIsOpen(false)}>
                        <ConnectButton label={isConnected ? undefined : "Get started"} variant={isConnected ? "badge" : "primary"} />
                    </span>
                </div>

                <button
                    type="button"
                    onClick={toggleTheme}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', zIndex: 100 }}
                    aria-label="Toggle dark mode"
                >
                    {mounted ? (resolvedTheme === 'light' ? <Sun size={20} /> : <Moon size={20} />) : <Sun size={20} />}
                </button>

                <button
                    className={styles.mobileMenuToggle}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {isOpen && (
                <div className={styles.mobileOverlay} onClick={() => setIsOpen(false)} />
            )}
        </header>
    );
}
