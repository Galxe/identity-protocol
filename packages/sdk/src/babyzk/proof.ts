import { FileOrURI } from "@/utils";
import { groth16, WholeProof, VKey, BabyZKCircuitInput } from "@/crypto/babyzk/deps";
import { CircuitInput } from "@/credential/credential";

/**
 * Generate a proof for a given circuit and input.
 * @param witnessGenWasm The wasm file or URI for the witness generator.
 * @param zkey The zkey file or URI.
 * @param input The circuit input.
 * @returns The proof.
 */
export async function genProof(witnessGenWasm: FileOrURI, zkey: FileOrURI, input: CircuitInput): Promise<WholeProof> {
  // keys of input that have undefined value will be filtered out
  return await groth16.genProof(witnessGenWasm, zkey, input as BabyZKCircuitInput);
}

/**
 * Verify a credential proof.
 * @param vkey The verification key.
 * @param proof The proof.
 * @returns true if the proof is valid.
 */
export async function verifyProofRaw(vkey: VKey, proof: WholeProof): Promise<boolean> {
  return await groth16.verify(vkey, proof);
}
