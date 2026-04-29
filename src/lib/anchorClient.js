import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from './idl/pulse_ai_protocol.json';
import { PROGRAM_ID } from './pulseProtocol';

export function createPulseProgram(connection, wallet) {
  if (!wallet?.publicKey || !wallet?.sendTransaction) return null;
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  return new Program(idl, new PublicKey(PROGRAM_ID), provider);
}
