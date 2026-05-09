import { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import useSolPrice from '../hooks/useSolPrice';
import PulseLogo from './PulseLogo';
import { BiMenu, BiMoon, BiSun } from 'react-icons/bi';
import { CgClose } from 'react-icons/cg';

export default function Header({ activeTab, setActiveTab, theme, onToggleTheme, onGoHome }) {
  const { price } = useSolPrice();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'ai', label: 'AI Insights' },
    { id: 'discover', label: 'Discover' },
    { id: 'positions', label: 'Positions' },
    { id: 'swap', label: 'Swap' },
  ];

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [sidebarOpen]);

  const navigateMobile = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const goHome = () => {
    onGoHome();
    setSidebarOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-pulse-border bg-pulse-bg/92 backdrop-blur-xl">
      <div className="mx-auto flex w-[94%] items-center justify-between gap-4 py-3.5 md:w-[92%] lg:w-[88%] xl:w-[80%]">
        <button
          type="button"
          onClick={goHome}
          className="flex items-center gap-3 border-none bg-transparent p-0 text-left"
        >
          <PulseLogo size={40} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-pulse-text">Pulse AI</h1>
            <div className="flex items-center gap-2 text-xs text-pulse-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-pulse-green" />
              {price ? (
                <span>
                  SOL ${price.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span className={price.change24h >= 0 ? 'text-pulse-green ml-1' : 'text-pulse-red ml-1'}>
                    {price.change24h >= 0 ? '+' : ''}{price.change24h.toFixed(2)}%
                  </span>
                </span>
              ) : (
                <span>Loading...</span>
              )}
            </div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`border-b-2 px-1 py-2 text-sm font-medium transition-all ${activeTab === tab.id
                ? 'border-pulse-accent text-pulse-text'
                : 'border-transparent text-pulse-muted hover:text-pulse-text'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          {theme === 'dark' ?
            <BiSun
              style={{ width: "30px", height: "30px" }}
              onClick={onToggleTheme} />
            :
            <BiMoon
              style={{ width: "30px", height: "30px" }}
              onClick={onToggleTheme} />}
          <div className="hidden md:block">
            <WalletMultiButton />
          </div>

          <BiMenu
            className='md:hidden'
            style={{ width: "40px", height: "40px" }}
            onClick={() => setSidebarOpen(true)}
          />

          {/* <WalletMultiButton /> */}
        </div>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close dashboard navigation"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="mobile-dashboard-sidebar"
        className={`fixed left-0 top-0 z-50 h-screen w-[82vw] max-w-80 border-r border-pulse-border bg-pulse-bg px-4 py-5 shadow-2xl transition-transform duration-200 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goHome}
            className="flex items-center gap-3 border-none bg-transparent p-0 text-left"
          >
            <PulseLogo size={36} />
            <div>
              <p className="text-sm font-semibold text-pulse-text">Pulse AI</p>
              <p className="text-xs text-pulse-muted">Dashboard</p>
            </div>
          </button>

          <CgClose
            style={{ width: "40px", height: "40px" }}
            onClick={() => setSidebarOpen(false)}
          />
        </div>

        <nav className="flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => navigateMobile(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`rounded-lg px-3 py-3 text-left text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-pulse-accent text-white'
                : 'bg-pulse-card text-pulse-muted hover:text-pulse-text'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* <div className="mt-6 border-t border-pulse-border pt-4"> */}
        {/* <button
            type="button"
            className="w-full rounded-lg border border-pulse-border bg-pulse-card px-3 py-3 text-left text-sm font-medium text-pulse-text"
          > */}

        {/* </button> */}
        {/* </div> */}
        <div className="mt-5 md:hidden">
          <WalletMultiButton />
        </div>

      </aside>
    </header>
  );
}
