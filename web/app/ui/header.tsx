'use client';

import { useEffect, useState } from "react";
import "./styles/layout.scss";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { ConnectButton } from "@/components/shared/connect-button";

type HeaderProps = {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
};

const Header = ({ isSidebarOpen, onToggleSidebar }: HeaderProps) => {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <header>
            <div className="header-leading">
                <button
                    className="mobile-toggle"
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    aria-expanded={isSidebarOpen}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="header-copy">
                    <p>Welcome back</p>
                    <span>Manage your stash clearly across every screen size.</span>
                </div>
            </div>
            <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>

                <button
                    className="btn btn-outline p-2 border rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    type="button"
                    onClick={toggleTheme}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }}
                >
                    {mounted ? (resolvedTheme === 'light' ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} />}
                </button>
                <ConnectButton variant="badge" />
            </div>
        </header>
    );
};

export default Header;
