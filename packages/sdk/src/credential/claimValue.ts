import { split256 } from "@/utils";
import { ClaimType, ScalarType, BoolType, PropType, PropHashEnum } from "./claimType";
import { CredError, ErrorName } from "@/errors";

/**
 * MarshaledClaimValue is the JSON representation of a Claim value.
 * Either a string or an object with a string and a bigint array.
 * When type is Scalar or Boolean, the value is a string.
 * When type is Property, the value is an object with a string and a bigint array.
 */
export type MarshaledClaimValue =
  | string
  | {
      str: string;
      value: string;
    };

/**
 * ClaimValue is a value of a claim.
 * This base class is abstract and should not be instantiated.
 */
export abstract class ClaimValue {
  constructor(public type: ClaimType) {
    this.type = type;
  }

  /**
   * @returns the string representation of the Claim value. Only
   * available for the credential owner as a reference, cannot be
   * used for verification.
   */
  public abstract strValue(): string;

  /**
   * @returns the underlying value that will be used during verification,
   * one value can be represented by multiple bigint values.
   */
  public abstract value(): bigint[];

  /**
   * @returns the JSON representation **object** of the Claim value.
   */
  public abstract toJSON(): MarshaledClaimValue;
}

/**
 * ScalarValue is a value of a scalar-typed claim.
 */
export class ScalarValue extends ClaimValue {
  constructor(tp: ScalarType, private val: bigint) {
    super(tp);
    // Validate that the provided value fits within the width of the Scalar type
    const maxValue = (BigInt(1) << BigInt(tp.width)) - BigInt(1);
    if (val < 0 || val > maxValue) {
      throw new CredError(ErrorName.InvalidClaimValue, `out of range Scalar value ${val}`);
    }
  }

  public override strValue(): string {
    return this.val.toString();
  }

  public override value(): bigint[] {
    if (this.type.width === 256) {
      const splitted = split256(this.val);
      return [splitted.msb, splitted.lsb];
    } else {
      return [this.val];
    }
  }

  public override toJSON(): MarshaledClaimValue {
    return this.strValue();
  }
}

/**
 * PropValue is a value of a property-typed claim.
 */
export class PropValue extends ClaimValue {
  private val: string;
  private hash: bigint;

  constructor(tp: PropType, val: string, hash?: bigint) {
    super(tp);
    this.val = val;
    if (hash) {
      // Validate that the provided value fits within the width of the Property type
      const maxValue = (BigInt(1) << BigInt(tp.width)) - BigInt(1);
      if (hash < 0 || hash > maxValue) {
        throw new CredError(ErrorName.InvalidClaimValue, `out of range property hash ${val}`);
      }
      // validate if value is provided, it must matches the hash computed from the string.
      if (tp.hashAlgorithm != PropHashEnum.Custom && tp.doHash(val) !== hash) {
        throw new CredError(
          ErrorName.InvalidClaimValue,
          `provided hash value mismatch, hash ${tp.hashAlgorithm}, but ${tp.doHash(val)} != ${hash}`
        );
      }
      this.hash = hash;
    } else {
      this.hash = tp.doHash(val);
    }
  }

  public override strValue(): string {
    return this.val;
  }

  public override value(): bigint[] {
    return [this.hash];
  }

  public override toJSON(): MarshaledClaimValue {
    return { str: this.strValue(), value: this.hash.toString() };
  }
}

/**
 * BoolValue is a value of a boolean-typed claim.
 */
export class BoolValue extends ClaimValue {
  constructor(private val: boolean) {
    super(new BoolType());
  }

  public override strValue(): string {
    return this.val.toString();
  }

  public override value(): bigint[] {
    return [this.val ? BigInt(1) : BigInt(0)];
  }

  public override toJSON(): MarshaledClaimValue {
    return this.strValue();
  }
}
