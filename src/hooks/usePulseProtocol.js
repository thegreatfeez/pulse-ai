import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BN } from '@coral-xyz/anchor';
import { SystemProgram, Transaction } from '@solana/web3.js';
import { createPulseProgram } from '../lib/anchorClient';
import {
  buildRecordPositionIntentIx,
  deriveAdviceCommitmentPda,
  deriveUserRiskProfilePda,
  fetchPositionIntentsByAuthority,
  fetchRiskPolicy,
  fetchUserRiskProfile,
  hashTo32Bytes,
} from '../lib/pulseProtocol';

export default function usePulseProtocol() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, sendTransaction, connected } = wallet;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profilePda, setProfilePda] = useState(null);
  const [riskPolicy, setRiskPolicy] = useState(null);
  const [riskPolicyPda, setRiskPolicyPda] = useState(null);
  const [positionIntents, setPositionIntents] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!connected || !publicKey) {
      setProfile(null);
      setProfilePda(null);
      return null;
    }

    setProfileLoading(true);
    try {
      const data = await fetchUserRiskProfile(connection, publicKey);
      setProfile(data.profile);
      setProfilePda(data.pda.toBase58());
      setProfileLoading(false);
      return data.profile;
    } catch (err) {
      setError(err.message || 'Failed to fetch profile');
      setProfileLoading(false);
      return null;
    }
  }, [connected, connection, publicKey]);

  const refreshRiskPolicy = useCallback(async () => {
    if (!connected || !publicKey) {
      setRiskPolicy(null);
      setRiskPolicyPda(null);
      return null;
    }
    try {
      const data = await fetchRiskPolicy(connection, publicKey);
      setRiskPolicy(data.policy);
      setRiskPolicyPda(data.pda.toBase58());
      return data.policy;
    } catch (err) {
      setError(err.message || 'Failed to fetch risk policy');
      return null;
    }
  }, [connected, connection, publicKey]);

  const refreshPositionIntents = useCallback(async () => {
    if (!connected || !publicKey) {
      setPositionIntents([]);
      return [];
    }
    try {
      const intents = await fetchPositionIntentsByAuthority(connection, publicKey, 10);
      setPositionIntents(intents);
      return intents;
    } catch (err) {
      setError(err.message || 'Failed to fetch position intents');
      return [];
    }
  }, [connected, connection, publicKey]);

  useEffect(() => {
    refreshProfile();
    refreshRiskPolicy();
    refreshPositionIntents();
  }, [refreshPositionIntents, refreshProfile, refreshRiskPolicy]);

  const initializeUserRiskProfile = useCallback(async ({
    riskMode = 1,
    maxPositionBps = 500,
    maxConcentrationBps = 3000,
  } = {}) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    try {
      const program = createPulseProgram(connection, wallet);
      if (!program) throw new Error('Wallet adapter does not support Anchor transactions');
      const [userRiskProfile] = await deriveUserRiskProfilePda(publicKey);
      const signature = await program.methods
        .initializeUserRiskProfile(riskMode, maxPositionBps, maxConcentrationBps)
        .accounts({
          authority: publicKey,
          userRiskProfile,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await refreshProfile();
      setLoading(false);
      return signature;
    } catch (err) {
      setError(err.message || 'Failed to initialize profile');
      setLoading(false);
      throw err;
    }
  }, [connected, connection, publicKey, sendTransaction]);

  const recordAdviceCommitment = useCallback(async ({
    nonce,
    advicePayload,
    contextPayload,
    portfolioValueLamports,
    riskScore,
  }) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    try {
      const program = createPulseProgram(connection, wallet);
      if (!program) throw new Error('Wallet adapter does not support Anchor transactions');
      const adviceHash = await hashTo32Bytes(advicePayload);
      const contextHash = await hashTo32Bytes(contextPayload);
      const [adviceCommitment] = await deriveAdviceCommitmentPda(publicKey, nonce);
      const signature = await program.methods
        .recordAdviceCommitment(
          new BN(String(nonce)),
          Array.from(adviceHash),
          Array.from(contextHash),
          new BN(String(portfolioValueLamports)),
          riskScore
        )
        .accounts({
          authority: publicKey,
          adviceCommitment,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setLoading(false);
      return signature;
    } catch (err) {
      setError(err.message || 'Failed to record advice commitment');
      setLoading(false);
      throw err;
    }
  }, [connected, connection, publicKey, sendTransaction]);

  const updateUserRiskProfile = useCallback(async ({
    riskMode,
    maxPositionBps,
    maxConcentrationBps,
  }) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    try {
      const program = createPulseProgram(connection, wallet);
      if (!program) throw new Error('Wallet adapter does not support Anchor transactions');
      const [userRiskProfile] = await deriveUserRiskProfilePda(publicKey);
      const signature = await program.methods
        .updateUserRiskProfile(riskMode, maxPositionBps, maxConcentrationBps)
        .accounts({
          authority: publicKey,
          userRiskProfile,
        })
        .rpc();
      await refreshProfile();
      setLoading(false);
      return signature;
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      setLoading(false);
      throw err;
    }
  }, [connected, connection, publicKey, refreshProfile, wallet]);

  const recordPositionIntent = useCallback(async ({
    nonce,
    tokenMint,
    side = 0,
    amountLamports,
    expectedSlippageBps = 100,
  }) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }
    setLoading(true);
    setError(null);
    try {
      const ix = await buildRecordPositionIntentIx({
        authority: publicKey,
        nonce,
        tokenMint,
        side,
        amountLamports,
        expectedSlippageBps,
      });
      const tx = new Transaction().add(ix);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      await refreshPositionIntents();
      setLoading(false);
      return signature;
    } catch (err) {
      setError(err.message || 'Failed to record position intent');
      setLoading(false);
      throw err;
    }
  }, [connected, connection, publicKey, refreshPositionIntents, sendTransaction]);

  return {
    loading,
    error,
    profile,
    profilePda,
    riskPolicy,
    riskPolicyPda,
    positionIntents,
    profileLoading,
    refreshProfile,
    refreshRiskPolicy,
    refreshPositionIntents,
    initializeUserRiskProfile,
    updateUserRiskProfile,
    recordAdviceCommitment,
    recordPositionIntent,
  };
}
