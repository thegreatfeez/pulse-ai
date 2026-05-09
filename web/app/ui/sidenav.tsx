'use client';
// import { useAppKitAccount } from "@reown/appkit/react"
import { BoxIcon, LayoutDashboard, MenuSquare, Settings2, X } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { MdSend } from "react-icons/md";

type SidebarProps = {
    isOpen: boolean;
    onNavigate: () => void;
};

const Sidebar = ({ isOpen, onNavigate }: SidebarProps) => {
    const pathname = usePathname();


    return (<>

        <aside
            className={`nav-sidebar ${isOpen ? "open" : ""}`}
        >
            <div className="title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Link
                    href="/"
                    onClick={onNavigate}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}
                    aria-label="Go to landing page"
                    className="brand-logo"
                >
                    <span className="brand-pill">
                        <span className="brand-core" />
                        <span className="brand-spark" />
                    </span>
                    <div className="brand-text">
                        <h1>Stash</h1>
                        <p>Stablecoin banking</p>
                    </div>
                </Link>

                <button
                    className="mobile-close-btn"
                    onClick={onNavigate}
                    aria-label="Close sidebar"
                >
                    <X size={24} />
                </button>
            </div>
            <ul>
                <li>
                    <Link
                        href="/dashboard/overview"
                        className={`link ${pathname === '/dashboard/overview' ? 'active' : ''}`}
                        onClick={onNavigate}
                    >
                        <div>
                            <span><LayoutDashboard /></span>
                            <span
                            >Overview </span>
                        </div>            </Link>
                </li>
                <li>
                    <Link
                        href="/dashboard/flexible"
                        className={`link ${pathname === '/dashboard/flexible' ? 'active' : ''}`}
                        onClick={onNavigate}
                    >
                        <div>
                            <span>< BoxIcon /></span>
                            <span
                            >Flexible </span>
                        </div>            </Link>
                </li>

                <li>
                    <Link
                        href="/dashboard/fixed"
                        className={`link ${pathname === '/dashboard/fixed' ? 'active' : ''}`}
                        onClick={onNavigate}
                    >
                        <div>
                            <span><MenuSquare /></span>
                            <span
                            >Fixed</span>
                        </div>            </Link>
                </li>
                <li>
                    <Link
                        href="/dashboard/transfer"
                        className={`link ${pathname === '/dashboard/transfer' ? 'active' : ''}`}
                        onClick={onNavigate}
                    >
                        <div>
                            <span><MdSend /></span>
                            <span
                            >P2P Transfer </span>
                        </div>            </Link>
                </li>
                <li>
                    <Link
                        href="/dashboard/settings"
                        className={`link ${pathname === '/settings' ? 'active' : ''}`}
                        onClick={onNavigate}
                    >
                        <div>
                            <span><Settings2 /></span>
                            <span
                            >Settings </span>
                        </div>            </Link>
                </li>
            </ul>
        </aside>
    </>)
}

export default Sidebar
