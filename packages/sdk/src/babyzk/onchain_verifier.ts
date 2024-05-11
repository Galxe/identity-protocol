import { render as renderSolidityCode } from "@/babyzk/templates/onchain_verifier_template";
import { VKey, WholeProof } from "@/crypto/babyzk/deps";
import { Circuit, IntrinsicPublicSignal } from "@/credential/credential";

/**
 * generate solidity code from circuit and verification key.
 * This is the on-chain verifier contract for BabyZK stack.
 */
export function genVerifierSolidity(circuit: Circuit, vkey: VKey): string {
  return renderSolidityCode(circuit, vkey);
}

/**
 * ProofVerifier is an interface for static verification of zero-knowledge proofs.
 */
export interface solidityVerifierCallData {
  proofs: string[];
  publicSignals: string[];
}

/**
 * convertToEvmCalldata converts a WholeProof to a BabyzkEvmVerifierCallData.
 */
export function convertToEvmCalldata(proof: WholeProof): solidityVerifierCallData {
  return {
    proofs: [
      proof.proof.pi_a[0],
      proof.proof.pi_a[1],
      proof.proof.pi_b[0][1],
      proof.proof.pi_b[0][0],
      proof.proof.pi_b[1][1],
      proof.proof.pi_b[1][0],
      proof.proof.pi_c[0],
      proof.proof.pi_c[1],
    ],
    publicSignals: proof.publicSignals,
  };
}

/**
 * defaultPublicSignalGetter is the default implementation of the public signal getter for babyzk.
 * Unless the circuit was not generated with the SDK, you should always use this function to get the public signal.
 */
export function defaultPublicSignalGetter(signal: IntrinsicPublicSignal, proof: WholeProof): bigint | undefined {
  const rv = proof.publicSignals[signal];
  if (rv !== undefined) {
    return BigInt(rv);
  }
  return rv;
}
