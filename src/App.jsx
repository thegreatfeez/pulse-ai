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

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedToken, setSelectedToken] = useState(null);
  const [swapSide, setSwapSide] = useState('buy');
  const [detailToken, setDetailToken] = useState(null);
  const [aiToken, setAiToken] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.localStorage.getItem('pulse-theme') || 'dark';
  });
  const [surface, setSurface] = useState(() => {
    if (typeof window === 'undefined') return 'landing';
    return window.localStorage.getItem('pulse-surface') || 'landing';
  });

  const { connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { price } = useSolPrice();
  const portfolio = useWalletPortfolio(price?.usd);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('pulse-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!connected) {
      setSurface('landing');
    }
  }, [connected]);

  useEffect(() => {
    window.localStorage.setItem('pulse-surface', surface);
  }, [surface]);

  const openApp = (tab = 'dashboard') => {
    setActiveTab(tab);
    setSurface('app');
    setDetailToken(null);
  };

  const handleSelectToken = (token) => {
    setDetailToken(token);
  };

  const handleSwap = (token) => {
    setSelectedToken(token);
    setSwapSide('buy');
    setDetailToken(null);
    setActiveTab('swap');
    setSurface('app');
  };

  const handleSellBack = (token) => {
    setSelectedToken(token);
    setSwapSide('sell');
    setDetailToken(null);
    setActiveTab('swap');
    setSurface('app');
  };

  const handleAnalyzeToken = (token) => {
    setAiToken(token);
    setDetailToken(null);
    setActiveTab('ai');
    setSurface('app');
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
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        onGoHome={() => setSurface('landing')}
      />
      <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-28 md:px-5 md:pb-6 md:pt-24 lg:px-6">
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
