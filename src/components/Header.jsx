import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import useSolPrice from '../hooks/useSolPrice';

export default function Header({ activeTab, setActiveTab }) {
  const { price } = useSolPrice();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'ai', label: 'AI Insights' },
    { id: 'discover', label: 'Discover' },
    { id: 'positions', label: 'Positions' },
    { id: 'swap', label: 'Swap' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-pulse-bg/95 backdrop-blur border-b border-pulse-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pulse-accent to-pulse-cyan flex items-center justify-center text-lg font-bold">
            P
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Solana Pulse AI</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-pulse-green animate-pulse" />
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
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-pulse-card rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-pulse-accent text-white shadow-lg shadow-pulse-accent/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <WalletMultiButton />
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-pulse-accent text-white'
                : 'text-slate-400 bg-pulse-card'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
