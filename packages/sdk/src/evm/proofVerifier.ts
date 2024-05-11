import { BigNumberish } from "ethers";
import { IProofVerifier, IProofVerifier__factory } from "@galxe-identity-protocol/evm-contracts";
import { Base, Options } from "@/evm/base";
import type { VKey, WholeProof } from "@/babyzk";
import { convertToEvmCalldata } from "@/babyzk/onchain_verifier";

/**
 * ProofVerifier is an interface for static verification of zero-knowledge proofs.
 */
export class ProofVerifier extends Base<IProofVerifier> {
  constructor(address: string, options?: Options) {
    const { signerOrProvider } = options || {};
    const contract = IProofVerifier__factory.connect(address);
    super(contract, signerOrProvider);
  }

  /**
   * Retrieves the verification keys necessary for verifying proofs.
   * @returns A promise that resolves to an array of numbers representing the verification keys.
   */
  public async getVerificationKeys(): Promise<BigNumberish[]> {
    return await this.contract.getVerificationKeys();
  }

  /**
   * Retrieves the verification keys necessary for verifying proofs.
   * @returns A promise that resolves to an object representing the verification keys.
   */
  public async getVerificationKeysRaw(): Promise<VKey> {
    const vks = (await this.contract.getVerificationKeys()).map(vk => vk.toString());
    if (vks.length < 16) {
      throw new Error("Invalid verification keys length");
    }

    const nPublic = (vks.length - 16) / 2;
    const nIC = (vks.length - 14) / 2;
    const protocol = "groth16";
    const curve = "bn128";
    const vk_alpha_1 = [vks[0] as string, vks[1] as string, 1n.toString()];

    const vk_beta_2 = [
      [vks[3] as string, vks[2] as string],
      [vks[5] as string, vks[4] as string],
      [1n.toString(), 0n.toString()],
    ];
    const vk_gamma_2 = [
      [vks[7] as string, vks[6] as string],
      [vks[9] as string, vks[8] as string],
      [1n.toString(), 0n.toString()],
    ];
    const vk_delta_2 = [
      [vks[11] as string, vks[10] as string],
      [vks[13] as string, vks[12] as string],
      [1n.toString(), 0n.toString()],
    ];
    const IC: string[][] = [];
    for (let i = 0; i < nIC; i++) {
      IC.push([vks[14 + i * 2] as string, vks[15 + i * 2] as string, 1n.toString()]);
    }
    return {
      protocol,
      curve,
      nPublic,
      vk_alpha_1,
      vk_beta_2,
      vk_gamma_2,
      vk_delta_2,
      IC,
    };
  }

  /**
   * Checks if the public signals are aliased, which should never be used in proofs.
   * @param pubSignals An array of numbers representing the public signals.
   * @returns A promise that resolves to a boolean indicating if any public signal is aliased (`true`) or not (`false`).
   */
  public async isAliased(pubSignals: BigNumberish[]): Promise<boolean> {
    return await this.contract.isAliased(pubSignals);
  }

  /**
   * Verifies a cryptographic proof and its public signals.
   * @param proofs An array of numbers representing the cryptographic proof.
   * @param pubSignals An array of numbers representing the public signals.
   * @returns A promise that resolves to a boolean indicating whether the proof is valid (`true`) or not (`false`).
   */
  public async verifyProof(proofs: BigNumberish[], pubSignals: BigNumberish[]): Promise<boolean> {
    return await this.contract.verifyProof(proofs, pubSignals);
  }

  /**
   * Verifies a cryptographic proof and its public signals.
   * @param proofs An array of numbers representing the cryptographic proof.
   * @param pubSignals An array of numbers representing the public signals.
   * @returns A promise that resolves to a boolean indicating whether the proof is valid (`true`) or not (`false`).
   */
  public async verifyWholeProof(proof: WholeProof): Promise<boolean> {
    const calldata = convertToEvmCalldata(proof);
    return await this.contract.verifyProof(calldata.proofs, calldata.publicSignals);
  }
}
