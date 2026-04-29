import test from 'node:test';
import assert from 'node:assert/strict';
import { PublicKey } from '@solana/web3.js';
import {
  COMMITMENT_SCHEMA_VERSION,
  buildAdviceCommitmentPayloads,
  canonicalJSONStringify,
} from '../src/lib/commitmentSchema.js';
import { decodeRiskPolicy, decodeUserRiskProfile } from '../src/lib/pulseProtocol.js';

function writeU16LE(value) {
  const out = new Uint8Array(2);
  const view = new DataView(out.buffer);
  view.setUint16(0, value, true);
  return out;
}

function writeI64LE(value) {
  let v = BigInt(value);
  if (v < 0n) v += 1n << 64n;
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i += 1) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function writeU64LE(value) {
  let v = BigInt(value);
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i += 1) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function concat(...parts) {
  const size = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

test('canonicalJSONStringify sorts object keys', () => {
  const a = canonicalJSONStringify({ b: 2, a: 1, c: { z: 3, y: 2 } });
  const b = canonicalJSONStringify({ c: { y: 2, z: 3 }, a: 1, b: 2 });
  assert.equal(a, b);
});

test('buildAdviceCommitmentPayloads includes schema version', () => {
  const { contextPayload, advicePayload } = buildAdviceCommitmentPayloads({
    wallet: 'wallet',
    token: 'token',
    portfolioValueUsd: 100,
    solPriceUsd: 150,
    analysis: { signal: 'HOLD', confidence: 50, summary: 's', suggested_action: 'a' },
    riskScore: 42,
  });
  assert.match(contextPayload, new RegExp(COMMITMENT_SCHEMA_VERSION.replace('.', '\\.')));
  assert.match(advicePayload, new RegExp(COMMITMENT_SCHEMA_VERSION.replace('.', '\\.')));
});

test('decodeUserRiskProfile decodes expected fields', () => {
  const authority = new PublicKey('11111111111111111111111111111111').toBytes();
  const data = concat(
    new Uint8Array(8),
    authority,
    Uint8Array.of(2),
    writeU16LE(400),
    writeU16LE(2500),
    writeI64LE(1_700_000_000),
    writeI64LE(1_700_000_100)
  );
  const decoded = decodeUserRiskProfile(data);
  assert.equal(decoded.riskMode, 2);
  assert.equal(decoded.maxPositionBps, 400);
  assert.equal(decoded.maxConcentrationBps, 2500);
});

test('decodeRiskPolicy decodes expected fields', () => {
  const authority = new PublicKey('11111111111111111111111111111111').toBytes();
  const data = concat(
    new Uint8Array(8),
    authority,
    writeU64LE(1_000),
    writeU64LE(5_000_000),
    writeU16LE(500),
    writeU16LE(3000),
    writeU16LE(8000),
    writeI64LE(1_700_000_500)
  );
  const decoded = decodeRiskPolicy(data);
  assert.equal(decoded.minPortfolioLamports, 1000);
  assert.equal(decoded.maxPortfolioLamports, 5_000_000);
  assert.equal(decoded.maxPositionBps, 500);
  assert.equal(decoded.maxConcentrationBps, 3000);
  assert.equal(decoded.volatilityScaleBps, 8000);
});
