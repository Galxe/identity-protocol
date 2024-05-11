import { genRandomBN128 } from "@/utils";
import { poseidonBigInts } from "@/crypto/hash";
import type { WholeProof } from "@/babyzk";
import { babyzk } from "@/babyzk";
import { Credential } from "@/credential/credential";
import * as utils from "@/utils";
import * as statement from "@/credential/statement";
import * as credType from "@/credential/credType";
// import * as errors from "@/errors";
import type { SignerOrProvider } from "@/evm/base";
import { createTypeRegistry } from "@/evm/v1";

/**
 * BabyzkProofGenGadgets is a struct that contains the wasm and zkey for the babyzk's proof generation.
 */
export interface BabyzkProofGenGadgets {
  wasm: Uint8Array;
  zkey: Uint8Array;
}

/**
 * IdentitySlice is a slice of a user's identity. Due to the identity multiplicity,
 * (see whitepaper), a user can have multiple identities for different apps.
 * Each identity is represented by an IdentitySlice for the user.
 */
export interface IdentitySlice {
  identitySecret: bigint;
  internalNullifier: bigint;
  // optional field that marks which domain this identity commitments,
  // e.g. "galxe.com", "twitter.com", or "realworld passport"
  domain?: string;
}

/**
 * User is a helper class for managing user's identities.
 */
export class User {
  // mapping from user's identity commitments to identity.
  private identitySlices: Map<bigint, IdentitySlice>;

  constructor() {
    this.identitySlices = new Map<bigint, IdentitySlice>();
  }

  /**
   * computeIdentityCommitment computes the identity commitment for the slice.
   */
  public static computeIdentityCommitment(slice: IdentitySlice): bigint {
    return poseidonBigInts([slice.identitySecret, slice.internalNullifier]);
  }

  /**
   * AddIdentitySlice adds an identity slice to the user.
   */
  public addIdentitySlice(slice: IdentitySlice): void {
    const commitment = User.computeIdentityCommitment(slice);
    this.identitySlices.set(commitment, slice);
  }

  /**
   * getIdentityCommitment returns the identity commitment of the user.
   * @param byDomain optional field that marks of which domain identity commitments to get,
   * e.g. "galxe.com", "twitter.com", or "realworld passport"
   * @returns the identity commitment of the user.
   * @throws an error if no identity slice is found for the given domain.
   */
  public getIdentityCommitment(byDomain?: string): bigint {
    if (byDomain === undefined) {
      if (this.identitySlices.size < 1) {
        throw new Error("no identity slice found");
      }
      return this.identitySlices.keys().next().value;
    }
    for (const [commitment, slice] of this.identitySlices) {
      if (byDomain && slice.domain !== byDomain) {
        continue;
      }
      return commitment;
    }
    throw new Error("No identity slice found");
  }

  /**
   * getIdentitySlices returns all the identity slices of the user.
   */
  public getIdentitySlices(): Map<bigint, IdentitySlice> {
    return this.identitySlices;
  }

  /**
   * getIdentitySliceByIdc returns the identity slice of the user by the identity commitment.
   */
  public getIdentitySliceByIdc(commitment: bigint): IdentitySlice | undefined {
    return this.identitySlices.get(commitment);
  }

  /**
   * createNewIdentitySlice creates a new identity slice for the user for the given domain.
   */
  public createNewIdentitySlice(domain?: string): IdentitySlice {
    const newSlice = {
      identitySecret: genRandomBN128(),
      internalNullifier: genRandomBN128(),
      domain,
    };
    this.addIdentitySlice(newSlice);
    return newSlice;
  }

  /**
   * getProofGenGadgetsByTypeID returns the proof generation gadgets for the given type ID.
   * All the proof generation gadget URIs are fetched from blockchain via the given provider.
   * Then the wasm and zkey are fetched from the URIs.
   */
  public static async fetchProofGenGadgetsByTypeID(
    typeID: bigint,
    provider: SignerOrProvider
  ): Promise<BabyzkProofGenGadgets> {
    const tpReg = createTypeRegistry({ signerOrProvider: provider });
    const tp = await tpReg.getType(typeID);
    return await User.fetchProofGenGadgetByTypeMetaURI(tp.resourceURI);
  }

  /**
   * fetchProofGenGadgetByTypeMetaURI fetches the wasm and zkey for the given type metadata URI.
   */
  public static async fetchProofGenGadgetByTypeMetaURI(typeMetaURI: string): Promise<BabyzkProofGenGadgets> {
    if (utils.parseURIType(typeMetaURI) === utils.URIType.Filepath) {
      throw new Error("Filepath is not supported for fetch, please use loadProofGenGadgetsFromFile instead.");
    }
    const metadata = await utils.fetchBodyString(
      utils.parseURIType(typeMetaURI) === utils.URIType.IPFS ? utils.ipfsToHttp(typeMetaURI) : typeMetaURI
    );
    const typeMeta = credType.utils.parseTypeMetadataJsonSpec(metadata);
    return await User.fetchProofGenGadgetByURIs(typeMeta.babyzk.witness_wasm_uri, typeMeta.babyzk.zkey_uri);
  }

  /**
   * fetchProofGenGadgetByURIs fetches the wasm and zkey for the given URIs.
   */
  public static async fetchProofGenGadgetByURIs(wasmUri: string, zkeyUri: string): Promise<BabyzkProofGenGadgets> {
    if (
      utils.parseURIType(wasmUri) === utils.URIType.Filepath ||
      utils.parseURIType(zkeyUri) === utils.URIType.Filepath
    ) {
      throw new Error("Filepath is not supported for fetch, please use loadProofGenGadgetsFromFile instead.");
    }
    const wasm = await utils.fetchBinary(
      utils.parseURIType(wasmUri) === utils.URIType.IPFS ? utils.ipfsToHttp(wasmUri) : wasmUri
    );
    const zkey = await utils.fetchBinary(
      utils.parseURIType(zkeyUri) === utils.URIType.IPFS ? utils.ipfsToHttp(zkeyUri) : zkeyUri
    );
    return { wasm, zkey };
  }

  /**
   * loadProofGenGadgetsFromFile loads the wasm and zkey for the given filepath.
   * @param wasmFilePath path to the wasm file
   * @param zkeyFilePath path to the zkey file
   * @returns the wasm and zkey for the given URIs.
   */
  public static async loadProofGenGadgetsFromFile(
    wasmFilePath: string,
    zkeyFilePath: string
  ): Promise<BabyzkProofGenGadgets> {
    const wasm = await utils.loadBinary(wasmFilePath);
    const zkey = await utils.loadBinary(zkeyFilePath);
    return { wasm, zkey };
  }

  /**
   * genBabyzkProof generates a zk proof for the given credential and proof options,
   * using identity commitment stored in this user.
   */
  public async genBabyzkProof(
    identityCommitment: bigint,
    cred: Credential,
    proofOptions: {
      externalNullifier: bigint;
      expiratedAtLowerBound: bigint;
      equalCheckId: bigint;
      pseudonym: bigint;
    },
    proofGenGadgets: {
      wasm: Uint8Array;
      zkey: Uint8Array;
    },
    statements: statement.Statement[]
  ): Promise<WholeProof> {
    // Assuming that the user has received the credential,
    // user can generate a zk proof to prove that he has sent more than 500 transactions, but no more than 5000.
    const userSecrets = this.getIdentitySliceByIdc(identityCommitment);
    if (!userSecrets) {
      throw new Error("No identity slice found");
    }
    const input = babyzk.genCircuitInput(
      cred,
      userSecrets,
      proofOptions.externalNullifier,
      proofOptions.pseudonym,
      new statement.StatementList(proofOptions.expiratedAtLowerBound, proofOptions.equalCheckId, statements)
    );
    return await babyzk.genProof(proofGenGadgets.wasm, proofGenGadgets.zkey, input);
  }
}
