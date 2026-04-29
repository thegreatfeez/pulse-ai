import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';

const programIdFromEnv =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.VITE_PROGRAM_ID;

export const PROGRAM_ID = new PublicKey(
  programIdFromEnv || '8CxcCkx2KxpYGQLice4r6LdjNjqsXB7eB5E8ZQMG89ig'
);

const encoder = new TextEncoder();

async function sha256Bytes(input) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return new Uint8Array(hashBuffer);
}

async function instructionDiscriminator(name) {
  const hash = await sha256Bytes(`global:${name}`);
  return hash.slice(0, 8);
}

function writeU16LE(value) {
  const out = new Uint8Array(2);
  const dv = new DataView(out.buffer);
  dv.setUint16(0, value, true);
  return out;
}

function writeU64LE(value) {
  const out = new Uint8Array(8);
  let v = BigInt(value);
  for (let i = 0; i < 8; i += 1) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function concatBytes(...parts) {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export async function deriveUserRiskProfilePda(authority) {
  return PublicKey.findProgramAddressSync(
    [encoder.encode('user-risk-profile'), authority.toBuffer()],
    PROGRAM_ID
  );
}

export async function deriveAdviceCommitmentPda(authority, nonce) {
  const nonceBytes = writeU64LE(nonce);
  return PublicKey.findProgramAddressSync(
    [encoder.encode('advice-commitment'), authority.toBuffer(), Buffer.from(nonceBytes)],
    PROGRAM_ID
  );
}

export async function deriveRiskPolicyPda(authority) {
  return PublicKey.findProgramAddressSync(
    [encoder.encode('risk-policy'), authority.toBuffer()],
    PROGRAM_ID
  );
}

export async function derivePositionIntentPda(authority, nonce) {
  const nonceBytes = writeU64LE(nonce);
  return PublicKey.findProgramAddressSync(
    [encoder.encode('position-intent'), authority.toBuffer(), Buffer.from(nonceBytes)],
    PROGRAM_ID
  );
}

export async function buildInitializeUserRiskProfileIx({
  authority,
  riskMode,
  maxPositionBps,
  maxConcentrationBps,
}) {
  const [userRiskProfile] = await deriveUserRiskProfilePda(authority);
  const disc = await instructionDiscriminator('initialize_user_risk_profile');
  const data = concatBytes(
    disc,
    Uint8Array.of(riskMode),
    writeU16LE(maxPositionBps),
    writeU16LE(maxConcentrationBps)
  );

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: userRiskProfile, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function buildUpdateUserRiskProfileIx({
  authority,
  riskMode,
  maxPositionBps,
  maxConcentrationBps,
}) {
  const [userRiskProfile] = await deriveUserRiskProfilePda(authority);
  const disc = await instructionDiscriminator('update_user_risk_profile');
  const data = concatBytes(
    disc,
    Uint8Array.of(riskMode),
    writeU16LE(maxPositionBps),
    writeU16LE(maxConcentrationBps)
  );

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: userRiskProfile, isSigner: false, isWritable: true },
    ],
    data,
  });
}

export async function buildRecordAdviceCommitmentIx({
  authority,
  nonce,
  adviceHash,
  contextHash,
  portfolioValueLamports,
  riskScore,
}) {
  const [adviceCommitment] = await deriveAdviceCommitmentPda(authority, nonce);
  const disc = await instructionDiscriminator('record_advice_commitment');
  const data = concatBytes(
    disc,
    writeU64LE(nonce),
    adviceHash,
    contextHash,
    writeU64LE(portfolioValueLamports),
    Uint8Array.of(riskScore)
  );

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: adviceCommitment, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function buildRecordPositionIntentIx({
  authority,
  nonce,
  tokenMint,
  side,
  amountLamports,
  expectedSlippageBps,
}) {
  const [positionIntent] = await derivePositionIntentPda(authority, nonce);
  const disc = await instructionDiscriminator('record_position_intent');
  const tokenMintPk = new PublicKey(tokenMint);
  const data = concatBytes(
    disc,
    writeU64LE(nonce),
    tokenMintPk.toBytes(),
    Uint8Array.of(side),
    writeU64LE(amountLamports),
    writeU16LE(expectedSlippageBps)
  );

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: positionIntent, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function hashTo32Bytes(input) {
  return sha256Bytes(input);
}

function readU16LE(view, offset) {
  return view.getUint16(offset, true);
}

function readI64LE(bytes, offset) {
  let result = 0n;
  for (let i = 7; i >= 0; i -= 1) {
    result = (result << 8n) | BigInt(bytes[offset + i]);
  }
  const signedLimit = 1n << 63n;
  if (result >= signedLimit) result -= 1n << 64n;
  return Number(result);
}

function readU64LE(bytes, offset) {
  let result = 0n;
  for (let i = 7; i >= 0; i -= 1) {
    result = (result << 8n) | BigInt(bytes[offset + i]);
  }
  return result;
}

export function decodeUserRiskProfile(accountData) {
  if (!accountData || accountData.length < 55) return null;
  const bytes = accountData instanceof Uint8Array ? accountData : new Uint8Array(accountData);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const authority = new PublicKey(bytes.slice(8, 40));
  const riskMode = bytes[40];
  const maxPositionBps = readU16LE(view, 41);
  const maxConcentrationBps = readU16LE(view, 43);
  const createdAt = readI64LE(bytes, 45);
  const updatedAt = readI64LE(bytes, 53);

  return {
    authority: authority.toBase58(),
    riskMode,
    maxPositionBps,
    maxConcentrationBps,
    createdAt,
    updatedAt,
  };
}

export async function fetchUserRiskProfile(connection, authority) {
  const [profilePda] = await deriveUserRiskProfilePda(authority);
  const accountInfo = await connection.getAccountInfo(profilePda, 'confirmed');
  if (!accountInfo) {
    return { pda: profilePda, profile: null };
  }
  return { pda: profilePda, profile: decodeUserRiskProfile(accountInfo.data) };
}

export function decodeRiskPolicy(accountData) {
  if (!accountData || accountData.length < 70) return null;
  const bytes = accountData instanceof Uint8Array ? accountData : new Uint8Array(accountData);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const authority = new PublicKey(bytes.slice(8, 40));

  return {
    authority: authority.toBase58(),
    minPortfolioLamports: Number(readU64LE(bytes, 40)),
    maxPortfolioLamports: Number(readU64LE(bytes, 48)),
    maxPositionBps: readU16LE(view, 56),
    maxConcentrationBps: readU16LE(view, 58),
    volatilityScaleBps: readU16LE(view, 60),
    updatedAt: readI64LE(bytes, 62),
  };
}

export async function fetchRiskPolicy(connection, authority) {
  const [policyPda] = await deriveRiskPolicyPda(authority);
  const accountInfo = await connection.getAccountInfo(policyPda, 'confirmed');
  if (!accountInfo) {
    return { pda: policyPda, policy: null };
  }
  return { pda: policyPda, policy: decodeRiskPolicy(accountInfo.data) };
}

export function decodePositionIntent(accountData) {
  if (!accountData || accountData.length < 99) return null;
  const bytes = accountData instanceof Uint8Array ? accountData : new Uint8Array(accountData);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  return {
    authority: new PublicKey(bytes.slice(8, 40)).toBase58(),
    nonce: Number(readU64LE(bytes, 40)),
    tokenMint: new PublicKey(bytes.slice(48, 80)).toBase58(),
    side: bytes[80],
    amountLamports: Number(readU64LE(bytes, 81)),
    expectedSlippageBps: readU16LE(view, 89),
    createdAt: readI64LE(bytes, 91),
  };
}

export async function fetchPositionIntentsByAuthority(connection, authority, limit = 20) {
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { dataSize: 99 },
      { memcmp: { offset: 8, bytes: authority.toBase58() } },
    ],
  });

  return accounts
    .map((a) => decodePositionIntent(a.account.data))
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
