/**
 * On-chain Risk Engine
 * Computes a composite risk score (0-100) for any Solana token.
 * Factors: liquidity depth, 24h volume, age, buy/sell ratio, FDV/liquidity.
 */

export function computeRiskScore(token) {
  const scores = {};

  // 1. Liquidity score (0-25) — more liquidity = lower risk
  const liq = token.liquidity || 0;
  if (liq >= 500000) scores.liquidity = 0;
  else if (liq >= 100000) scores.liquidity = 5;
  else if (liq >= 50000) scores.liquidity = 10;
  else if (liq >= 10000) scores.liquidity = 15;
  else if (liq >= 1000) scores.liquidity = 20;
  else scores.liquidity = 25;

  // 2. Volume score (0-25) — healthy volume = lower risk
  const vol = token.volume24h || 0;
  const volToLiq = liq > 0 ? vol / liq : 0;
  if (volToLiq >= 2) scores.volume = 0;
  else if (volToLiq >= 0.5) scores.volume = 5;
  else if (volToLiq >= 0.1) scores.volume = 10;
  else if (vol >= 10000) scores.volume = 15;
  else scores.volume = 25;

  // 3. Age score (0-20) — newer = higher risk
  const ageHours = token.ageHours;
  if (ageHours === null || ageHours === undefined) scores.age = 15;
  else if (ageHours >= 720) scores.age = 0; // 30+ days
  else if (ageHours >= 168) scores.age = 5; // 7+ days
  else if (ageHours >= 24) scores.age = 10;
  else if (ageHours >= 6) scores.age = 15;
  else scores.age = 20;

  // 4. Buy/Sell ratio (0-15) — extreme imbalance = risk
  const buys = token.buys24h || 0;
  const sells = token.sells24h || 0;
  const total = buys + sells;
  if (total === 0) {
    scores.txnRatio = 15;
  } else {
    const ratio = buys / total;
    if (ratio >= 0.35 && ratio <= 0.65) scores.txnRatio = 0;
    else if (ratio >= 0.25 && ratio <= 0.75) scores.txnRatio = 5;
    else if (ratio >= 0.15 && ratio <= 0.85) scores.txnRatio = 10;
    else scores.txnRatio = 15;
  }

  // 5. FDV/Liquidity ratio (0-15) — high fdv with low liquidity = rug risk
  const fdv = token.fdv || 0;
  if (liq === 0) scores.fdvRatio = 15;
  else {
    const fdvLiq = fdv / liq;
    if (fdvLiq <= 10) scores.fdvRatio = 0;
    else if (fdvLiq <= 50) scores.fdvRatio = 5;
    else if (fdvLiq <= 200) scores.fdvRatio = 10;
    else scores.fdvRatio = 15;
  }

  const total_score = Object.values(scores).reduce((a, b) => a + b, 0);

  return {
    score: Math.min(100, total_score),
    breakdown: scores,
    level: getRiskLevel(total_score),
    color: getRiskColor(total_score),
  };
}

export function getRiskLevel(score) {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MODERATE';
  if (score <= 75) return 'HIGH';
  return 'EXTREME';
}

export function getRiskColor(score) {
  if (score <= 25) return '#10b981';
  if (score <= 50) return '#f59e0b';
  if (score <= 75) return '#f97316';
  return '#ef4444';
}

export function getPositionSizeRecommendation(riskScore, portfolioValue) {
  const base = 0.02; // 2% base position size
  let multiplier = 1;

  if (riskScore <= 25) multiplier = 2;      // Low risk: up to 4%
  else if (riskScore <= 50) multiplier = 1;  // Moderate: 2%
  else if (riskScore <= 75) multiplier = 0.5; // High: 1%
  else multiplier = 0.25;                     // Extreme: 0.5%

  const pct = base * multiplier;
  const amount = portfolioValue * pct;

  return { pct, amount, multiplier };
}

export function generateSignals(token) {
  const signals = [];
  const { score, breakdown } = computeRiskScore(token);

  if (token.priceChange1h > 10) {
    signals.push({ type: 'warning', label: 'Pumping +' + token.priceChange1h.toFixed(1) + '% 1h' });
  }
  if (token.priceChange1h < -10) {
    signals.push({ type: 'alert', label: 'Dumping ' + token.priceChange1h.toFixed(1) + '% 1h' });
  }
  if (breakdown.liquidity >= 20) {
    signals.push({ type: 'danger', label: 'Low liquidity — rug risk' });
  }
  if (breakdown.fdvRatio >= 10) {
    signals.push({ type: 'warning', label: 'High FDV/Liquidity ratio' });
  }
  if (breakdown.txnRatio >= 10) {
    signals.push({ type: 'warning', label: 'Imbalanced buy/sell ratio' });
  }
  if (breakdown.age >= 15) {
    signals.push({ type: 'warning', label: 'Very new token — high risk' });
  }
  if (token.volume24h > 1000000 && score <= 35) {
    signals.push({ type: 'bullish', label: 'High volume, low risk' });
  }
  if (token.priceChange24h > 20 && score <= 40) {
    signals.push({ type: 'bullish', label: 'Strong momentum' });
  }

  return signals;
}
