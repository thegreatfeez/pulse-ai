export const COMMITMENT_SCHEMA_VERSION = '1.0.0';

function canonicalize(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = canonicalize(value[key]);
    }
    return sorted;
  }
  return value;
}

export function canonicalJSONStringify(value) {
  return JSON.stringify(canonicalize(value));
}

export function buildAdviceCommitmentPayloads({
  wallet,
  token,
  portfolioValueUsd,
  solPriceUsd,
  analysis,
  riskScore,
}) {
  const context = {
    schema_version: COMMITMENT_SCHEMA_VERSION,
    wallet,
    token,
    portfolio_value_usd: portfolioValueUsd,
    sol_price_usd: solPriceUsd,
    risk_score: riskScore,
  };

  const advice = {
    schema_version: COMMITMENT_SCHEMA_VERSION,
    signal: analysis?.signal ?? null,
    confidence: analysis?.confidence ?? null,
    summary: analysis?.summary ?? null,
    suggested_action: analysis?.suggested_action ?? null,
  };

  return {
    contextPayload: canonicalJSONStringify(context),
    advicePayload: canonicalJSONStringify(advice),
  };
}
