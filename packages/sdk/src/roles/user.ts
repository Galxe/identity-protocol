import { genRandomBN128 } from "@/utils";
import { poseidonBigInts } from "@/crypto/hash";
import type { WholeProof } from "@/babyzk";
import { babyzk } from "@/babyzk";
import { Credential } from "@/credential/credential";
import * as utils from "@/utils";
import * as statement from "@/credential/statement";
import * as query from "@/credential/query";
import * as credType from "@/credential/credType";
import { unwrap } from "@/errors";
import type { SignerOrProvider } from "@/evm/base";
import { createTypeRegistry } from "@/evm/v1";
import { ClaimTypeEnum, ScalarType, PropType, BoolType } from "../credential/claimType";

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
    const userSecrets = this.getIdentitySliceByIdc(identityCommitment);
    if (!userSecrets) {
      throw new Error("No identity slice found");
    }
    const input = babyzk.genCircuitInput(
      cred,
      userSecrets,
      proofOptions.pseudonym,
      proofOptions.externalNullifier,
      new statement.StatementList(proofOptions.expiratedAtLowerBound, proofOptions.equalCheckId, statements)
    );
    return await babyzk.genProof(proofGenGadgets.wasm, proofGenGadgets.zkey, input);
  }

  /**
   * genBabyzkProofWithQuery generates a zk proof for the given credential and proof
   * query string, using identity commitment stored in this user.
   */
  public async genBabyzkProofWithQuery(
    identityCommitment: bigint,
    cred: Credential,
    proofGenGadgets: {
      wasm: Uint8Array;
      zkey: Uint8Array;
    },
    queryStr: string
  ): Promise<WholeProof> {
    const userSecrets = this.getIdentitySliceByIdc(identityCommitment);
    if (!userSecrets) {
      throw new Error("No identity slice found");
    }

    const queryObj = unwrap(query.parse(queryStr));
    const statements: statement.Statement[] = [];
    const statementNames = new Set<string>();
    for (const expr of queryObj.conditions) {
      const claim = cred.body.tp.claims.find(c => c.name === expr.identifier);
      if (!claim) {
        throw new Error(`Claim '${expr.identifier}' not found in the credential`);
      }
      statementNames.add(claim.name);
      switch (claim.type.tp) {
        case ClaimTypeEnum.Scalar: {
          statements.push(
            new statement.ScalarStatement(
              claim.type as ScalarType,
              BigInt((expr.value as query.Range).from),
              BigInt((expr.value as query.Range).to)
            )
          );
          break;
        }
        case ClaimTypeEnum.Property: {
          const ct = claim.type as PropType;
          const qs = expr.value as query.Set;
          if (ct.nEqualChecks !== qs.length) {
            throw new Error(`Number of equal checks does not match for claim '${claim.name}'`);
          }

          statements.push(new statement.PropStatement(ct, qs));
          break;
        }
        case ClaimTypeEnum.Boolean: {
          let reveal = false;
          if (expr.operation === "REVEAL") {
            reveal = true;
          } else if (expr.operation === "HIDE") {
            reveal = false;
          } else {
            throw new Error("Unsupported operation");
          }
          statements.push(new statement.BoolStatement(claim.type as BoolType, reveal));
          break;
        }
        default:
          throw new Error("Unsupported claim type");
      }
    }

    // Ensure all claims have corresponding statements, and vice versa.
    for (const claim of cred.body.tp.claims) {
      if (!statementNames.has(claim.name)) {
        throw new Error(`Missing query statement for claim '${claim.name}'`);
      }
    }
    const claimNames = new Set<string>(cred.body.tp.claims.map(c => c.name));
    for (const name of statementNames) {
      if (!claimNames.has(name)) {
        throw new Error(`Missing claim '${name}' for query statements`);
      }
    }

    const input = babyzk.genCircuitInput(
      cred,
      userSecrets,
      queryObj.options.pseudonym,
      queryObj.options.externalNullifier,
      new statement.StatementList(queryObj.options.expiredAtLowerBound, queryObj.options.equalCheckId, statements)
    );
    return await babyzk.genProof(proofGenGadgets.wasm, proofGenGadgets.zkey, input);
  }
}
