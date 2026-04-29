import { useState } from 'react';
import WalletProvider from './components/WalletProvider';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TokenDiscovery from './components/TokenDiscovery';
import Positions from './components/Positions';
import SwapPanel from './components/SwapPanel';
import TokenDetail from './components/TokenDetail';
import AIInsights from './components/AIInsights';
import useSolPrice from './hooks/useSolPrice';
import useWalletPortfolio from './hooks/useWalletPortfolio';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedToken, setSelectedToken] = useState(null);
  const [swapSide, setSwapSide] = useState('buy');
  const [detailToken, setDetailToken] = useState(null);
  const [aiToken, setAiToken] = useState(null);

  const { price } = useSolPrice();
  const portfolio = useWalletPortfolio(price?.usd);

  const handleSelectToken = (token) => {
    setDetailToken(token);
  };

  const handleSwap = (token) => {
    setSelectedToken(token);
    setSwapSide('buy');
    setDetailToken(null);
    setActiveTab('swap');
  };

  const handleSellBack = (token) => {
    setSelectedToken(token);
    setSwapSide('sell');
    setDetailToken(null);
    setActiveTab('swap');
  };

  const handleAnalyzeToken = (token) => {
    setAiToken(token);
    setDetailToken(null);
    setActiveTab('ai');
  };

  const handleCloseDetail = () => {
    setDetailToken(null);
  };

  return (
    <div className="min-h-screen bg-pulse-bg">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 py-6">
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
          onClose={handleCloseDetail}
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
