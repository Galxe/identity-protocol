import { Ok, Err, Result, encased, CredError, ErrorName } from "@/errors";
import { poseidonStr, keccak256Str } from "@/crypto/hash";
import { ClaimValue, ScalarValue, BoolValue, PropValue, MarshaledClaimValue } from "./claimValue";

/**
 * Claim type is a type of a claim.
 * It can be a scalar, a property, or a boolean.
 */
export enum ClaimTypeEnum {
  Scalar = "uint",
  Property = "prop",
  Boolean = "bool",
}

/**
 * Property hash algorithm is the hash algorithm used to hash a property
 * from its string value to a bigint value.
 */
export enum PropHashEnum {
  Poseidon = "p",
  Keccak256 = "k",
  Custom = "c",
}

/**
 * Convert a string representation of a property hash algorithm to a PropHashEnum.
 */
export const makePropertyHashAlgorithm = (str: string): PropHashEnum => {
  switch (str) {
    case "p":
      return PropHashEnum.Poseidon;
    case "k":
      return PropHashEnum.Keccak256;
    case "c":
      return PropHashEnum.Custom;
    default:
      throw new CredError(ErrorName.InvalidTypeParameter, `unknown hash algorithm ${str}`);
  }
};

/**
 * Claim type is a type of a claim.
 * This base class is abstract and should not be instantiated.
 */
export abstract class ClaimType {
  constructor(public tp: ClaimTypeEnum, public width: number) {
    this.tp = tp;
    this.width = width;
  }

  public equal(c: ClaimType): boolean {
    return this.tp === c.tp && this.width === c.width;
  }

  public toString(): string {
    return `${this.tp}<${this.width}>`;
  }

  public create(str: MarshaledClaimValue): ClaimValue {
    throw new CredError(ErrorName.InvalidClaimValue, `fromJSON not implemented: ${str}`);
  }
}

/**
 * Scalar is a claim type that represents a scalar value.
 * width range is [8, 256] and must be a multiple of 8.
 */
export class ScalarType extends ClaimType {
  static MAX_WIDTH = 256;

  constructor(width: number) {
    super(ClaimTypeEnum.Scalar, width);
    if (width <= 0 || width % 8 !== 0 || width > ScalarType.MAX_WIDTH) {
      throw new CredError(ErrorName.InvalidTypeParameter, `invalid Scalar width ${width}`);
    }
  }

  /**
   * @returns a ScalarValue from scalar value's JSON representation.
   * which must be a string.
   */
  public override create(str: MarshaledClaimValue): ScalarValue {
    if (typeof str === "string") {
      return new ScalarValue(this, BigInt(str));
    } else {
      throw new CredError(ErrorName.InvalidClaimValue, `invalid Scalar value ${str}`);
    }
  }
}

/**
 * Property is a claim type that represents a property value.
 * Because the property value is hashed to a bigint value, the
 * hash algorithm is specified in its type.
 *
 * The range of width is [8, 248] and must be a multiple of 8.
 *
 * The number of equals-to-check is the number of name_equals_to signals
 * that will be generated for this property. For example, if nEqualsToCheck
 * is 2, then two name_equals_to signals will be generated for this property.
 * e.g. nationality:prop<8,k,2>
 * The above property will generate two name_equals_to signals.
 */
export class PropType extends ClaimType {
  static MAX_WIDTH = 248;
  static MAX_N_EQUAL_CHECKS = 8;

  constructor(width: number, public hashAlgorithm: PropHashEnum, public nEqualChecks = 1) {
    super(ClaimTypeEnum.Property, width);
    if (width <= 0 || width % 8 !== 0 || width > PropType.MAX_WIDTH) {
      throw new CredError(ErrorName.InvalidTypeParameter, `invalid property width ${width}`);
    }
    if (nEqualChecks < 1 || nEqualChecks > PropType.MAX_N_EQUAL_CHECKS) {
      throw new CredError(ErrorName.InvalidTypeParameter, `invalid nEqualsToCheck ${nEqualChecks}`);
    }
  }

  /**
   * @returns a PropValue from property value's JSON representation.
   * which must be a string or an object with a "str" and "value" field.
   * representing the string value and the hash value respectively.
   */
  public override create(obj: MarshaledClaimValue): PropValue {
    if (typeof obj === "string") {
      // NOTE: it is allowed to provide a string value for a property-typed claim
      // but it is not recommended.
      return new PropValue(this, obj);
    } else {
      return new PropValue(this, obj.str, BigInt(obj.value));
    }
  }

  /**
   * Compute the hash of a string value using the configured hash algorithm.
   * @param value - the string value to be hashed.
   * @returns a bigint, the hash value, masked to the width of the property.
   */
  public doHash(value: string): bigint {
    return this.doMask(this.computeHash(value, this.hashAlgorithm));
  }

  /**
   * doMask masks a bigint value to the width of the property.
   * It cut off the bits that cannot be fit into the width of the property
   * by only keeping the least significant bits.
   */
  public doMask(v: bigint): bigint {
    return v & (BigInt(2 ** this.width) - BigInt(1));
  }

  public override equal(c: ClaimType): boolean {
    if (c.tp !== ClaimTypeEnum.Property) {
      return false;
    }
    const p = c as PropType;
    return super.equal(p) && this.hashAlgorithm === p.hashAlgorithm && this.nEqualChecks === p.nEqualChecks;
  }

  public override toString(): string {
    return `${this.tp}<${this.width}, ${this.hashAlgorithm}, ${this.nEqualChecks}>`;
  }

  private computeHash(value: string, algorithm: PropHashEnum): bigint {
    let hash: Result<bigint> = { ok: false, error: new Error() };
    switch (algorithm) {
      case PropHashEnum.Poseidon:
        hash = poseidonStr(value);
        break;
      case PropHashEnum.Keccak256:
        hash = keccak256Str(value);
        break;
      case PropHashEnum.Custom:
        throw new CredError(
          ErrorName.InvalidClaimValue,
          `Hash value must be provided for custom hash algorithm ${value}`
        );
      default:
        throw new CredError(ErrorName.InvalidClaimValue, `unknown hash algorithm ${algorithm}`);
    }
    if (!hash.ok) {
      throw hash.error;
    }
    return hash.value;
  }
}

/**
 * Bool is a claim type that represents a boolean value.
 */
export class BoolType extends ClaimType {
  constructor() {
    super(ClaimTypeEnum.Boolean, 8);
  }

  /**
   * @returns a BoolValue from boolean value's JSON representation.
   * which must be a string, either "true" or "false".
   */
  public override create(obj: MarshaledClaimValue): BoolValue {
    if (typeof obj === "string") {
      return new BoolValue(obj === "true");
    } else {
      throw new CredError(ErrorName.InvalidClaimValue, `invalid Bool value ${obj}`);
    }
  }

  public override toString(): string {
    return `${this.tp}`;
  }
}

/**
 * Parse a string representation of a claim type.
 * @param str - a string representation of a claim type.
 * @returns a ClaimType object, wrapped in Result<T>
 *
 * @example
 * ```
 * const tp = parseClaimType("uint<32>");
 * // tp.type === ClaimTypeEnum.Scalar
 * // tp.width === 32
 * ```
 *
 */
export function parseClaimType(str: string): Result<ClaimType> {
  const pattern = /([a-zA-Z0-9_]+)(?:<(.*?)>)?/;
  const match = pattern.exec(str);
  if (!match) {
    return Err(new CredError(ErrorName.InvalidTypeParameter, `invalid claim type: ${str}`));
  }
  const typeName = match[1];
  const args = match[2] ? match[2].split(",").map((s: string) => s.trim()) : [];
  const invalidTypeArgsErr = new CredError(ErrorName.InvalidTypeParameter, `invalid type parameters ${args}`);
  switch (typeName) {
    case ClaimTypeEnum.Scalar:
      if (args.length !== 1) {
        return Err(invalidTypeArgsErr);
      }
      return encased(() => new ScalarType(parseInt(args[0] as string)));
    case ClaimTypeEnum.Property:
      if (args.length !== 2 && args.length !== 3) {
        return Err(invalidTypeArgsErr);
      }
      return encased(
        () =>
          new PropType(
            parseInt(args[0] as string),
            makePropertyHashAlgorithm(args[1] as string),
            args.length == 3 ? parseInt(args[2] as string) : 1
          )
      );
    case ClaimTypeEnum.Boolean:
      if (args.length !== 0) {
        return Err(invalidTypeArgsErr);
      }
      return encased(() => new BoolType());
    default:
      return Err(new CredError(ErrorName.InvalidTypeName, `unknown claim type: ${typeName}`));
  }
}

/**
 * Claim definition is a pair of a claim name and a claim type.
 */
export type ClaimDef = {
  name: string;
  type: ClaimType;
};

/**
 * Parse a string representation of a claim definition.
 * @param s - a string representation of a claim definition.
 * @returns a ClaimDef object, wrapped in Result<T>
 * @example
 * ```
 * const claimDef = parseClaimDef("age:uint<256>");
 * // claimDef.name === "age"
 * // claimDef.type === ClaimTypeEnum.Scalar
 * // claimDef.width === 256
 * ```
 * @example
 * ```
 * const claimDef = parseClaimDef("name:prop<8,k,2>");
 * // claimDef.name === "name"
 * // claimDef.type === ClaimTypeEnum.Property
 * // claimDef.width === 8
 * // claimDef.nEqualsToCheck === 8
 * // claimDef.hashAlgorithm === PropHashEnum.Keccak256
 * ```
 * @example
 * ```
 * const claimDef = parseClaimDef("followed:bool");
 * // claimDef.name === "followed"
 * // claimDef.type === ClaimTypeEnum.Boolean
 * ```
 *
 * @remarks
 * The claim name must be a valid identifier, which means it must start with
 * a letter or an underscore, and can only contain letters, numbers, and
 * underscores.
 *
 * The claim name must not start with any of the following prefixes:
 * - sig_
 * - out_
 * - in_
 * - agg_
 *
 * The claim name must not be any of the following reserved names:
 * - version
 * - type
 * - context
 * - id
 * - identity_secret
 * - internal_nullifier
 * - external_nullifier
 * - revealing_identity
 * - revealing_identity_hmac
 * - expiration_lb
 * - id_equals_to
 *
 */
export function parseClaimDef(s: string): Result<ClaimDef> {
  const isValidClaimName = (str: string): boolean => {
    const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (forbiddenClaimNamePrefix.some((prefix: string) => str.startsWith(prefix))) {
      return false;
    }
    return pattern.test(str) && !reservedClaimNames.includes(str);
  };
  const claimDef = s.split(":").map((s: string) => s.trim());
  if (claimDef.length !== 2) {
    return Err(new CredError(ErrorName.InvalidTypeDef, s));
  }
  const [name, tp] = claimDef;
  // impossible, just to satisfy the type checker
  if (name === undefined || tp === undefined) {
    return Err(new CredError(ErrorName.InvalidTypeDef, s));
  }
  if (!isValidClaimName(name)) {
    return Err(new CredError(ErrorName.InvalidClaimName, name));
  }
  const tpDef = parseClaimType(tp);
  if (!tpDef.ok) {
    return Err(tpDef.error);
  }
  return Ok({ name, type: tpDef.value });
}

// reserved claim name prefixes.
// These prefixes are reserved because they may conflict with
// internal codegen names.
const forbiddenClaimNamePrefix = ["sig_", "out_", "in_", "agg_"];

// reserved claim names
// NOTE: This is unfortunately coupled with the codegen of verification
// stacks. If you change codegen, you may also need to update here.
const reservedClaimNames = [
  "version",
  "type",
  "context",
  "id",
  "identity_secret",
  "internal_nullifier",
  "external_nullifier",
  "revealing_identity",
  "revealing_identity_hmac",
  "expiration_lb",
  "id_equals_to",
  "revocation_root",
];
