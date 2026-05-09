import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import WalletProvider from './components/WalletProvider';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TokenDiscovery from './components/TokenDiscovery';
import Positions from './components/Positions';
import SwapPanel from './components/SwapPanel';
import TokenDetail from './components/TokenDetail';
import AIInsights from './components/AIInsights';
import PulseLandingPage from './components/PulseLandingPage';
import useSolPrice from './hooks/useSolPrice';
import useWalletPortfolio from './hooks/useWalletPortfolio';

const TAB_ROUTES = {
  dashboard: '/dashboard',
  ai: '/dashboard/ai-insights',
  discover: '/dashboard/discover',
  positions: '/dashboard/positions',
  swap: '/dashboard/swap',
};

const ROUTE_TABS = Object.fromEntries(
  Object.entries(TAB_ROUTES).map(([tab, path]) => [path, tab]),
);

function resolveRoute(pathname) {
  if (!pathname) {
    return { surface: 'landing', activeTab: 'dashboard' };
  }

  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (normalized === '/') {
    return { surface: 'landing', activeTab: 'dashboard' };
  }

  const activeTab = ROUTE_TABS[normalized];

  if (activeTab) {
    return { surface: 'app', activeTab };
  }

  return { surface: 'landing', activeTab: 'dashboard' };
}

function AppContent() {
  const [routeState, setRouteState] = useState(() => {
    if (typeof window === 'undefined') {
      return { surface: 'landing', activeTab: 'dashboard' };
    }

    return resolveRoute(window.location.pathname);
  });
  const [selectedToken, setSelectedToken] = useState(null);
  const [swapSide, setSwapSide] = useState('buy');
  const [detailToken, setDetailToken] = useState(null);
  const [aiToken, setAiToken] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.localStorage.getItem('pulse-theme') || 'dark';
  });

  const { connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { price } = useSolPrice();
  const portfolio = useWalletPortfolio(price?.usd);
  const { activeTab, surface } = routeState;

  const navigateToPath = (path, { replace = false } = {}) => {
    if (typeof window === 'undefined') return;

    const nextRoute = resolveRoute(path);
    const method = replace ? 'replaceState' : 'pushState';

    window.history[method]({}, '', path);
    setRouteState(nextRoute);
  };

  const navigateToTab = (tab, options) => {
    const path = TAB_ROUTES[tab] || TAB_ROUTES.dashboard;
    navigateToPath(path, options);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('pulse-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handlePopState = () => {
      setRouteState(resolveRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openApp = (tab = 'dashboard') => {
    navigateToTab(tab);
    setDetailToken(null);
  };

  const handleSelectToken = (token) => {
    setDetailToken(token);
  };

  const handleSwap = (token) => {
    setSelectedToken(token);
    setSwapSide('buy');
    setDetailToken(null);
    navigateToTab('swap');
  };

  const handleSellBack = (token) => {
    setSelectedToken(token);
    setSwapSide('sell');
    setDetailToken(null);
    navigateToTab('swap');
  };

  const handleAnalyzeToken = (token) => {
    setAiToken(token);
    setDetailToken(null);
    navigateToTab('ai');
  };

  if (surface === 'landing') {
    return (
      <PulseLandingPage
        isConnected={connected}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        onGetStarted={() => setWalletModalVisible(true)}
        onExplore={() => openApp('dashboard')}
        onOpenInsights={() => openApp('ai')}
        onOpenDiscover={() => openApp('discover')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-pulse-bg text-pulse-text">
      <Header
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        onGoHome={() => navigateToPath('/')}
      />
      <main className="mx-auto w-[94%] pb-8 pt-24 md:w-[90%] md:pb-8 md:pt-28 lg:w-[82%] xl:w-[70%]">
        {activeTab === 'dashboard' && (
          <Dashboard onSelectToken={handleSelectToken} onSellToken={handleSellBack} />
        )}
        {activeTab === 'ai' && (
          <AIInsights
            selectedToken={aiToken}
            onSelectToken={setAiToken}
          />
        )}
        {activeTab === 'discover' && (
          <TokenDiscovery onSelectToken={handleSelectToken} />
        )}
        {activeTab === 'positions' && (
          <Positions />
        )}
        {activeTab === 'swap' && (
          <SwapPanel
            selectedToken={selectedToken}
            portfolioValue={portfolio.totalValueUsd}
            initialSide={swapSide}
          />
        )}
      </main>

      {detailToken && (
        <TokenDetail
          token={detailToken}
          portfolioValue={portfolio.totalValueUsd}
          onSwap={handleSwap}
          onAnalyze={handleAnalyzeToken}
          onClose={() => setDetailToken(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
