"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/ui/sidenav";
import Header from "../ui/header";
import { ConnectGate } from "@/components/shared/connect-gate";
import "../ui/styles/dashboard.scss";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const closeSidebarOnDesktop = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false);
            }
        };

        closeSidebarOnDesktop();
        window.addEventListener("resize", closeSidebarOnDesktop);

        return () => window.removeEventListener("resize", closeSidebarOnDesktop);
    }, []);

    return (
        <section className={`dashboard-container ${sidebarOpen ? "sidebar-open" : ""}`}>
            <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
            {sidebarOpen ? (
                <button
                    type="button"
                    className="dashboard-overlay"
                    aria-label="Close sidebar"
                    onClick={() => setSidebarOpen(false)}
                />
            ) : null}

            <section className="dashboard">
                <Header
                    isSidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen((current) => !current)}
                />
                <ConnectGate>{children}</ConnectGate>
            </section>
        </section>
    );
}
