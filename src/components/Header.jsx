import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import useSolPrice from '../hooks/useSolPrice';
import PulseLogo from './PulseLogo';

export default function Header({ activeTab, setActiveTab, theme, onToggleTheme, onGoHome }) {
  const { price } = useSolPrice();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'ai', label: 'AI Insights' },
    { id: 'discover', label: 'Discover' },
    { id: 'positions', label: 'Positions' },
    { id: 'swap', label: 'Swap' },
    { id: 'bridge', label: 'Bridge' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-pulse-border bg-pulse-bg/92 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-3.5">
        <button
          type="button"
          onClick={onGoHome}
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
              className={`border-b-2 px-1 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'border-pulse-accent text-pulse-text'
                  : 'border-transparent text-pulse-muted hover:text-pulse-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="hidden min-h-12 items-center rounded-xl border border-pulse-border bg-pulse-card px-4 text-sm font-medium text-pulse-text transition hover:border-pulse-accent/40 sm:inline-flex"
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <WalletMultiButton />
        </div>
      </div>

      <div className="md:hidden flex items-center gap-2 px-4 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={onGoHome}
          className="shrink-0 rounded-lg border border-pulse-border bg-pulse-card px-3 py-2 text-xs font-medium text-pulse-text"
        >
          Home
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className="shrink-0 rounded-lg border border-pulse-border bg-pulse-card px-3 py-2 text-xs font-medium text-pulse-text"
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-pulse-accent text-white'
                : 'text-pulse-muted bg-pulse-card'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
