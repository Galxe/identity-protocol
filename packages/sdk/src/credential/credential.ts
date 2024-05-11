import { solidityPackedKeccak256 } from "ethers";

import { CredError, ErrorName, Result, Err, Ok, encase, unwrap, encased } from "@/errors";
import {
  CURRENT_VERSION,
  JSONStringifyBigInts,
  sortedJSONString,
  FileOrURI,
  encodeToBase64,
  decodeFromBase64,
} from "@/utils";
import { SMTProof } from "@/crypto/smt";
import { poseidonStr } from "@/crypto/hash";

import { ClaimValue, MarshaledClaimValue } from "./claimValue";
import { CredType } from "./credType";
import { StatementList } from "./statement";
import { ClaimType } from "./claimType";

/**
 * Compute the context ID by taking the last 160 bits of the keccak256 of the context string.
 * @returns the context ID.
 */
export function computeContextID(context: string): bigint {
  const fullHash = solidityPackedKeccak256(["string"], [context]);
  // Truncate the hash to 160 bits
  return BigInt("0x" + fullHash.slice(-40));
}

/**
 * Enum of verification stack.
 * Starting from 1, 0 is not a valid value.
 * This is used to identify the verification stack used to sign the credential.
 */
export enum VerificationStackEnum {
  BabyZK = 1,
}

/**
 * Parse a number to a verification stack enum.
 * @param num is the number to parse.
 * @throws CredError if the number is not a valid verification stack enum.
 * @returns a verification stack enum.
 * */
export function parseVerificationStackEnum(num: number): VerificationStackEnum {
  switch (num) {
    case VerificationStackEnum.BabyZK:
      return VerificationStackEnum.BabyZK;
    default:
      throw new CredError(ErrorName.InvalidSignature, `unknown verification stack ${num}`);
  }
}

/**
 * Intrinsic public signals.
 */
export enum IntrinsicPublicSignal {
  Type = 0,
  Context = 1,
  Nullifier = 2,
  ExternalNullifier = 3,
  RevealIdentity = 4,
  ExpirationLb = 5,
  KeyId = 6,
  IdEqualsTo = 7,
  SigRevocationSmtRoot = 8,
}

/**
 * Hash value must be a bigint.
 */
export type HashValue = bigint;

/**
 * Raw signature must be a Uint8Array.
 */
export type RawSignature = Uint8Array;

/**
 * Raw public key must be a Uint8Array.
 */
export type RawPublicKey = Uint8Array;

/**
 * Signature metadata.
 * @param verificationStack is the verification stack used to sign the credential.
 * @param signatureID is the ID of the signature.
 * @param expiredAt is the expiration time of the signature.
 * @param identityCommitment is the identity commitment of the signer.
 * @param issuerID is the ID of the issuer. (unsigned)
 * @param chainID is the ID of the chain. (unsigned)
 * @param publicKey is the public key of the signer. (unsigned)
 */
export class SignatureMetadata {
  constructor(
    public verificationStack: VerificationStackEnum,
    public signatureID: bigint,
    public expiredAt: bigint,
    public identityCommitment: bigint,
    public issuerID: bigint,
    public chainID: bigint,
    public publicKey: RawPublicKey
  ) {
    // do type check on all the fields
    if (typeof this.verificationStack !== "number") {
      throw new CredError(ErrorName.InvalidParameter, "verificationStack must be a number");
    }
    if (typeof this.signatureID !== "bigint") {
      throw new CredError(ErrorName.InvalidParameter, "signatureID must be a bigint");
    }
    if (this.signatureID === 0n) {
      throw new CredError(ErrorName.InvalidParameter, "signatureID must be non-zero");
    }
    if (typeof this.expiredAt !== "bigint") {
      throw new CredError(ErrorName.InvalidParameter, "expiredAt must be a bigint");
    }
    if (typeof this.identityCommitment !== "bigint") {
      throw new CredError(ErrorName.InvalidParameter, "identityCommitment must be a bigint");
    }
    if (typeof this.issuerID !== "bigint") {
      throw new CredError(ErrorName.InvalidParameter, "issuerID must be a bigint");
    }
    if (typeof this.chainID !== "bigint") {
      throw new CredError(ErrorName.InvalidParameter, "chainID must be a bigint");
    }
  }

  public toJSON() {
    return {
      verification_stack: this.verificationStack,
      signature_id: this.signatureID.toString(),
      expired_at: this.expiredAt.toString(),
      identity_commitment: this.identityCommitment.toString(),
      issuer_id: this.issuerID.toString(),
      chain_id: this.chainID.toString(),
      public_key: encodeToBase64(this.publicKey),
    };
  }
}

/**
 * Signature is the signature of a credential.
 * @param metadata is the metadata of the signature.
 * @param signature is the raw signature.
 *
 */
export class Signature {
  constructor(
    public metadata: SignatureMetadata,
    public signature: RawSignature,
    public attachmentsSignature?: RawSignature /// attachmentsSignature is the signature of the attachments, optional.
  ) {}

  public toJSON() {
    return {
      metadata: this.metadata,
      signature: encodeToBase64(this.signature),
      attachmentsSignature: this.attachmentsSignature ? encodeToBase64(this.attachmentsSignature) : undefined,
    };
  }

  static fromJSON(json: { [key: string]: unknown }): Signature {
    if (!json.metadata || !json.signature) {
      throw new CredError(ErrorName.InvalidParameter, "metadata or signature is missing");
    }
    const md = json.metadata as { [key: string]: unknown };
    for (const key of [
      "verification_stack",
      "signature_id",
      "expired_at",
      "identity_commitment",
      "issuer_id",
      "chain_id",
      "public_key",
    ]) {
      if (!md[key]) {
        throw new CredError(ErrorName.InvalidParameter, `signature metadata field ${key} is missing`);
      }
    }
    const metadata = new SignatureMetadata(
      parseVerificationStackEnum(md.verification_stack as number),
      BigInt(md.signature_id as string),
      BigInt(md.expired_at as string),
      BigInt(md.identity_commitment as string),
      BigInt(md.issuer_id as string),
      BigInt(md.chain_id as string),
      decodeFromBase64(md.public_key as string)
    );
    const attachmentsSignature = json.attachmentsSignature
      ? decodeFromBase64(json.attachmentsSignature as string)
      : undefined;
    return new Signature(metadata, decodeFromBase64(json.signature as string), attachmentsSignature);
  }
}

/**
 * Header is the header of a credential.
 * @param version is the version of the Galxe protocol.
 * @param type is the type ID of the credential.
 * @param context is the context ID of the credential.
 * @param id is the unique ID of credential owner under the context.
 */
export class Header {
  constructor(public version: bigint, public type: bigint, public context: bigint, public id: bigint) {}
}

/**
 * MarshaledBody is the marshaled body of a credential.
 */
export type MarshaledBody = { [index: string]: MarshaledClaimValue };

/**
 * Body is the body of a credential.
 * @param tp is the type of the credential.
 * @param values is the values of the credential.
 * @throws CredError if the credential is invalid.
 */
export class Body {
  public tp: CredType;
  public values: ClaimValue[];
  constructor(tp: CredType, values: ClaimValue[]) {
    this.tp = tp;
    this.values = values;
    const err = this.isValid();
    if (err) {
      throw err;
    }
  }

  /**
   * @returns null if the credential is valid, otherwise an error.
   */
  public isValid(): CredError | null {
    if (this.tp.claims.length !== this.values.length) {
      return new CredError(
        ErrorName.InvalidClaimValue,
        `field count mismatch: ${this.tp.claims.length} != ${this.values.length}`
      );
    }

    for (let i = 0; i < this.tp.claims.length; i++) {
      if (!this.values[i]?.type.equal(this.tp.claims[i]?.type as ClaimType)) {
        return new CredError(
          ErrorName.InvalidClaimValue,
          `field type mismatch: ${this.values[i]?.type} != ${this.tp.claims[i]?.type}`
        );
      }
    }
    return null;
  }

  /**
   * marshal marshals the body to a string-indexed object.
   * @returns a marshaled body.
   */
  public marshal(): { [index: string]: MarshaledClaimValue } {
    const body: { [index: string]: MarshaledClaimValue } = {};
    for (let i = 0; i < this.tp.claims.length; i++) {
      const name = this.tp.claims[i]?.name as string;
      body[name] = this.values[i]?.toJSON() as MarshaledClaimValue;
    }
    return body;
  }

  /**
   * unmarshal a marshaled body to a body.
   * Unmarshal a body json object back to a body.
   * You must provide the type of the credential.
   *
   * @param tp is the type of the credential.
   * @param jsonObj is the marshaled body object.
   *
   * @throws CredError if the credential is invalid.
   * @returns a body.
   *
   */
  public static unmarshal(tp: CredType, jsonObj: MarshaledBody): Result<Body> {
    const values: ClaimValue[] = [];
    for (const claim of tp.claims) {
      const name = claim.name;
      if (!jsonObj[name]) {
        return Err(new CredError(ErrorName.InvalidCredential, `claim ${name} is missing`));
      }
      const val = encase(() => claim.type.create(jsonObj[name] as MarshaledClaimValue))();
      if (!val.ok) {
        return Err(new CredError(ErrorName.InvalidCredential, `failed to create value for claim ${name}`, val.error));
      }
      values.push(val.value);
    }
    const rv = new Body(tp, values);
    return Ok(rv);
  }
}

/**
 * AttachmentSet is a set of attachments.
 * Attachments are arbitrary data that can be attached to a credential.
 * Attachments are not signed for verification.
 */
export type AttachmentSet = { [index: string]: string };

/**
 * Credential is the credential.
 * @param header is the header of the credential.
 * @param body is the body of the credential.
 */
export class Credential {
  public header: Header;
  public body: Body;
  public signatures: Signature[];
  public attachments: AttachmentSet;

  constructor(header: Header, body: Body) {
    this.header = header;
    this.body = body;
    this.signatures = [];
    this.attachments = {};
  }

  public isSigned(): boolean {
    return this.signatures.length > 0;
  }

  private attachmentHash(): bigint {
    return unwrap(poseidonStr(sortedJSONString(this.attachments)));
  }

  public sign<SkType>(vs: VerificationStack<SkType>, sk: SkType, metadata: SignatureMetadata) {
    const hasher = vs.getHasher();
    const signer = vs.createSigner(sk);
    const hash = hasher.hash(this, metadata);
    if (this.body.tp.revocable) {
      // valid range of signature ID, when revocable is enabled, is [0, 2^revocable).
      // NOTE that 0 is a valid signature ID, which is used to indicate that the signature is not revocable.
      const maxSigID = BigInt(1) << BigInt(this.body.tp.revocable);
      if (metadata.signatureID >= maxSigID) {
        throw new CredError(
          ErrorName.InvalidSignature,
          `signature ID ${metadata.signatureID} is larger than max ${maxSigID}, because revocable depth is ${this.body.tp.revocable}`
        );
      }
    }
    // sign attachments only if there are.
    let attachmentsSignature: RawSignature | undefined = undefined;
    if (Object.keys(this.attachments).length > 0) {
      attachmentsSignature = signer.sign(this.attachmentHash());
    }
    this.signatures.push(new Signature(metadata, signer.sign(hash), attachmentsSignature));
  }

  public verify(vs: VerificationStack<unknown>, n = 0, includeAttachments = true): boolean {
    if (this.signatures.length === 0) {
      return false;
    }
    const sig = this.signatures[n];
    if (!sig) {
      throw new CredError(ErrorName.InvalidSignature, `signature ${n} is missing`);
    }
    const sigMetadata = sig.metadata;
    const hash = vs.getHasher().hash(this, sigMetadata);
    if (includeAttachments && Object.keys(this.attachments).length > 0) {
      if (!sig.attachmentsSignature) {
        // attachments are not signed.
        return false;
      }
      if (!vs.getVerifier().verify(this.attachmentHash(), sig.attachmentsSignature, sigMetadata.publicKey)) {
        // attachments signature is invalid.
        return false;
      }
    }
    return vs.getVerifier().verify(hash, sig.signature, sig.metadata.publicKey);
  }

  /**
   * marshal marshals the credential to a JSON string.
   * @param space is the space parameter for JSON.stringify.
   * @returns a JSON string.
   */
  public marshal(space = 0): string {
    const obj = {
      header: this.header,
      body: this.body.marshal(),
      signatures: this.signatures,
      attachments: Object.keys(this.attachments).length > 0 ? this.attachments : undefined,
    };
    return JSONStringifyBigInts(obj, space);
  }

  /**
   * unmarshal a JSON string to a credential.
   */
  public static unmarshal(tp: CredType, str: string): Result<Credential> {
    const rawResult = encase(JSON.parse)(str);
    if (!rawResult.ok) {
      return Err(new CredError(ErrorName.InvalidCredential, `failed to JSON parse credential`, rawResult.error));
    }
    const raw = rawResult.value;
    if (!raw.header) {
      return Err(new CredError(ErrorName.InvalidCredential, "header is missing"));
    }
    const rawHeader = raw.header;
    if (!rawHeader.version || !rawHeader.type || !rawHeader.context || !rawHeader.id) {
      return Err(new CredError(ErrorName.InvalidCredential, "header field is missing"));
    }
    if (BigInt(rawHeader.type) !== BigInt(tp.typeID)) {
      return Err(new CredError(ErrorName.InvalidCredential, `type mismatch: ${rawHeader.type} != ${tp.typeID}`));
    }
    const header = new Header(
      BigInt(raw.header.version),
      BigInt(raw.header.type),
      BigInt(raw.header.context),
      BigInt(raw.header.id)
    );
    const bodyResult = Body.unmarshal(tp, raw.body);
    if (!bodyResult.ok) {
      return Err(new CredError(ErrorName.InvalidCredential, `failed to parse body`, bodyResult.error));
    }
    const rv = new Credential(header, bodyResult.value);
    if (raw.signatures) {
      for (const sig of raw.signatures) {
        const signature = encase(Signature.fromJSON)(sig);
        if (!signature.ok) {
          return Err(new CredError(ErrorName.InvalidCredential, `failed to parse signature`, signature.error));
        }
        rv.signatures.push(signature.value);
      }
    }
    rv.attachments = raw.attachments ? raw.attachments : {};
    return Ok(rv);
  }

  /**
   * create a credential.
   */
  public static create(
    option: { type: CredType; contextID: bigint; userID: bigint },
    values: MarshaledBody
  ): Result<Credential> {
    return encased(() => {
      const header = new Header(CURRENT_VERSION, option.type.typeID, option.contextID, option.userID);
      const body = unwrap(Body.unmarshal(option.type, values));
      const newCred = new Credential(header, body);
      return newCred;
    });
  }
}

export interface Signer {
  sign(hash: HashValue): RawSignature;
}

export interface Hasher {
  hash(cred: Credential, metadata: SignatureMetadata): HashValue;
}

export interface Verifier {
  verify(hash: bigint, sigRaw: RawSignature, pubKey: RawPublicKey): boolean;
}

export type IdentityOwner = {
  identitySecret: bigint;
  internalNullifier: bigint;
};

/**
 * PublicSignalDef defines a public signal.
 */
export interface PublicSignalDef {
  // The name of the public signal.
  name: string;
  // ceiling is the upper bound of the public signal value, exclusive.
  // All public signal values needs to be less than some max value, which is either
  // (1) the modulus of the field of the circuit, or
  // (2) the defined upper bound of the type, e.g. 2^128 for uint128.
  // This check must be done outside of the circuit.
  ceiling: bigint;
}

/**
 * Aggregation mode is the aggregation mode of a claim type.
 * It is used to determine how to aggregate the signals of a claim.
 */
export enum AggregationMode {
  None = 0,
  // Take the greater value of the previous and new signal.
  // e.g. applied for signals of scalar value's lower bound.
  // result will be a tighter bound.
  TakeGreater = 1,
  TakeGreaterUint256 = 2,
  // Take the less value of the previous and new signal.
  // e.g. applied for signals of scalar value's upper bound.
  // result will be a tighter bound.
  TakeLess = 3,
  TakeLessUint256 = 4,
  // Set the signal to the new value if the signal is revealed.
  // e.g. applied for signals of boolean value and ID field.
  // Result will be the revealed value.
  SetIfRevealed = 5,
  // Add the new inequality signal to the set of inequalities,
  // unless the output result is equal.
  MergeUnlessEq = 6,
  // Set the signal to the new value.
  SetToNewValue = 7,
}

/**
 * Aggregation describes how to aggregate a public signal value.
 */
export class Aggregation {
  // Name of the destination field.
  public destName: string;
  // Type of the destination field.
  public destType: string;
  // Names of the source fields, in the order of aggregation.
  public srcNames: string[];
  // The mode tells how to aggregate the public signal values
  // in zkOAT contract.
  public mode: AggregationMode;

  constructor(v: { destName: string; destType: string; srcNames: string[]; mode: AggregationMode }) {
    this.destName = v.destName;
    this.destType = v.destType;
    this.srcNames = v.srcNames;
    this.mode = v.mode;
  }

  /**
   * genSolidityAggregation generates the Solidity code that aggregates the public signal values.
   * TODO: replace the source variable name with signals[i], i.e., the public signal vector and its index.
   * @returns a string of Solidity code that aggregates the public signal values.
   */
  public genSolidityAggregation(): string {
    switch (this.mode) {
      case AggregationMode.None:
        return "";
      case AggregationMode.TakeGreater:
        return `if (${this.destName} < ${this.srcNames[0]}) ${this.destName} = ${this.srcNames[0]};`;
      case AggregationMode.TakeGreaterUint256: {
        const originalVal = `((${this.srcNames[0]} << 128) + ${this.srcNames[1]})`;
        return `if (${this.destName} <  ${originalVal}) ${this.destName} = ${originalVal};`;
      }
      case AggregationMode.TakeLess:
        return `if (${this.destName} > ${this.srcNames[0]}) ${this.destName} = ${this.srcNames[0]};`;
      case AggregationMode.TakeLessUint256: {
        const originalVal = `((${this.srcNames[0]} << 128) + ${this.srcNames[1]})`;
        return `if (${this.destName} >  ${originalVal}) ${this.destName} = ${originalVal};`;
      }
      case AggregationMode.SetIfRevealed:
        return `if ((${this.srcNames[0]} & 1) == 1) ${this.destName} = ${this.srcNames[0]};`;
      case AggregationMode.MergeUnlessEq:
        // In the aggregated property map, 2 means equal, 1 means not equal, and 0 means unknown.
        // TODO: If we construct a deletable mapping, we can save some gas.
        return `if ((${this.srcNames[0]} & 1) == 1) ${this.destName}[${this.srcNames[0]} >> 1] = 2; else ${this.destName}[${this.srcNames[0]} >> 1] = 1;`;
      case AggregationMode.SetToNewValue:
        return `${this.destName} = ${this.srcNames[0]};`;
      default:
        throw new CredError(ErrorName.InvalidParameter, `unknown aggregation mode ${this.mode}`);
    }
  }

  /**
   * genSolidityDeclaration generates the Solidity declaration of the destination field.
   * @returns the Solidity declaration of the destination field.
   */
  public genSolidityDeclaration(): string {
    return `${this.destType} ${this.destName};`;
  }
}

export type IntrinsicSignalIndexMap = Map<IntrinsicPublicSignal, number>;
export class Circuit {
  public code: string;
  public publicSignalDefs: PublicSignalDef[];
  public intrinsicSignalIndexMap: IntrinsicSignalIndexMap;
  public aggregations: Aggregation[];

  constructor(v: {
    code: string;
    publicSignalDefs: PublicSignalDef[];
    intrinsicSignalIndexes: IntrinsicSignalIndexMap;
    aggregations: Aggregation[];
  }) {
    this.code = v.code;
    this.publicSignalDefs = v.publicSignalDefs;
    this.intrinsicSignalIndexMap = v.intrinsicSignalIndexes;
    this.aggregations = v.aggregations;
  }

  // /**
  //  * genSolidityAggregation generates the Solidity code that aggregates the public signal values.
  //  * @returns a string of Solidity code that aggregates the public signal values.
  //  */
  // public genSolidityAggregation(): string {
  //   const lines = [];
  //   for (const agg of this.aggregations) {
  //     lines.push(agg.genSolidityAggregation());
  //   }
  //   return lines.join("\n");
  // }

  // unused
  // public genSolidityValidate(): string {
  //   const lines = [];
  //   for (const def of this.publicSignalDefs) {
  //     lines.push(`require(${def.name} < ${def.ceiling}, "public signal ${def.name} is aliased");`);
  //   }
  //   return lines.join("\n");
  // }

  // /**
  //  * genSolidityDeclaration generates the Solidity declaration of the destination fields.
  //  * @returns the Solidity declaration of the destination fields.
  //  * */
  // public genSolidityDeclaration(): string {
  //   const lines = [];
  //   const declared = new Set<string>();
  //   for (const v of this.aggregations) {
  //     if (declared.has(v.destName)) {
  //       continue;
  //     }
  //     declared.add(v.destName);
  //     lines.push(v.genSolidityDeclaration());
  //   }
  //   return lines.join("\n");
  // }
}

/**
 * CircuitInput is the input to the circuit.
 */
export interface CircuitInput {
  [key: string]: bigint | bigint[];
}

/**
 * Serde is a serializer/deserializer.
 */
export interface Serde<T> {
  serialize(obj: T): Uint8Array;
  deserialize(buf: Uint8Array): T;
}

export interface VerificationStack<SkType, ProofType = unknown, VKeyType = unknown> {
  // prepare the verification stack
  prepare(): Promise<void>;

  // identity commitment related
  genIdentityCommitment(secret: bigint, nullifier: bigint): bigint;

  // private key related
  genRandomPrivateKey(): SkType;
  toPubKey(sk: SkType): RawPublicKey;
  toKeyID(pk: RawPublicKey): bigint;
  createSigner(sk: SkType): Signer;

  // hash and signature related
  getHasher: () => Hasher;
  getVerifier(): Verifier;

  // circuit related
  genCircuit(cred: CredType): Circuit;
  genCircuitInput(
    cred: Credential,
    owner: IdentityOwner,
    pseudonym: bigint,
    extNullifier: bigint,
    statements: StatementList,
    unrevokedProof?: SMTProof,
    n?: number
  ): CircuitInput;

  // proof related
  genProof(witnessGenWasm: FileOrURI, zkey: FileOrURI, input: CircuitInput): Promise<ProofType>;
  verifyProofRaw(vkey: VKeyType, proof: ProofType): Promise<boolean>;

  // on-chain verification.
  // This function should generate the on-chain verifier code.
  // Depending on the verification stack, it can be a Solidity or some other language code.
  genOnChainVerifierCode(circuit: Circuit, vkey: VKeyType): string;
  defaultPublicSignalGetter(signal: IntrinsicPublicSignal, proof: ProofType): bigint | undefined;
}
