import { BigNumberish, Overrides } from "ethers";
import {
  BabyzkStatefulVerifier as BabyzkStatefulVerifierContract,
  BabyzkStatefulVerifier__factory,
} from "@galxe-identity-protocol/evm-contracts";
import { Base, Options, Transaction } from "@/evm/base";
import type { WholeProof } from "@/babyzk";
import { convertToEvmCalldata } from "@/babyzk/onchain_verifier";
import { VerifyResult } from "./enum";

/**
 * BabyzkStatefulVerifier is a contract for on-chain stateful verification of zero-knowledge proofs.
 */
export class BabyzkStatefulVerifier extends Base<BabyzkStatefulVerifierContract> {
  constructor(address: string, options?: Options) {
    const { signerOrProvider } = options || {};
    const factory = new BabyzkStatefulVerifier__factory();
    const contract = factory.attach(address) as BabyzkStatefulVerifierContract;
    super(contract, signerOrProvider);
  }

  /**
   * Performs static verification of zero-knowledge proofs.
   * @param typeId The type ID associated with the proof.
   * @param contextId The context ID associated with the proof.
   * @param keyId The public key ID used for the proof.
   * @param proofs The array of proof elements.
   * @param publicSignals The array of public signals.
   * @param overrides Optional overrides for the transaction.
   * @returns A promise of the verification result.
   */
  public async verifyProofStatic(
    typeId: BigNumberish,
    contextId: BigNumberish,
    keyId: BigNumberish,
    proofs: BigNumberish[],
    publicSignals: BigNumberish[]
  ): Promise<VerifyResult> {
    const tx = await this.contract.verifyProofStatic(typeId, contextId, keyId, proofs, publicSignals);
    return Number(tx) as VerifyResult;
  }

  /**
   * Performs full verification of zero-knowledge proofs, including public key activity and revocation checks.
   * @param typeId The type ID associated with the proof.
   * @param contextId The context ID associated with the proof.
   * @param issuerId The issuer ID associated with the proof.
   * @param proofs The array of proof elements.
   * @param publicSignals The array of public signals.
   * @param overrides Optional overrides for the transaction.
   * @returns A promise of the verification result.
   */
  public async verifyProofFull(
    typeId: BigNumberish,
    contextId: BigNumberish,
    issuerId: BigNumberish,
    proofs: BigNumberish[],
    publicSignals: BigNumberish[]
  ): Promise<VerifyResult> {
    const tx = await this.contract.verifyProofFull(typeId, contextId, issuerId, proofs, publicSignals);
    return Number(tx) as VerifyResult;
  }

  public async verifyWholeProofFull(
    typeId: BigNumberish,
    contextId: BigNumberish,
    issuerId: BigNumberish,
    wholeProof: WholeProof
  ): Promise<VerifyResult> {
    const proofs = convertToEvmCalldata(wholeProof);
    const tx = await this.contract.verifyProofFull(typeId, contextId, issuerId, proofs.proofs, proofs.publicSignals);
    return Number(tx) as VerifyResult;
  }

  /**
   * Updates the TypeRegistry contract address.
   * @param newTypeRegistry The new TypeRegistry contract address.
   * @param overrides Optional overrides for the transaction.
   * @returns A promise of the transaction.
   */
  public async updateTypeRegistry(newTypeRegistry: string, overrides?: Overrides): Promise<Transaction<void>> {
    const tx = await this.contract.updateTypeRegistry(newTypeRegistry, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * Updates the IssuerRegistry contract address.
   * @param newIssuerRegistry The new IssuerRegistry contract address.
   * @param overrides Optional overrides for the transaction.
   * @returns A promise of the transaction.
   */
  public async updateIssuerRegistry(newIssuerRegistry: string, overrides?: Overrides): Promise<Transaction<void>> {
    const tx = await this.contract.updateIssuerRegistry(newIssuerRegistry, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * Retrieves the TypeRegistry contract address.
   * @returns A promise of the TypeRegistry contract address.
   */
  public async getTypeRegistry(): Promise<string> {
    return await this.contract.getTypeRegistry();
  }

  /**
   * Retrieves the IssuerRegistry contract address.
   * @returns A promise of the IssuerRegistry contract address.
   */
  public async getIssuerRegistry(): Promise<string> {
    return await this.contract.getIssuerRegistry();
  }
}
