import { solidityPackedKeccak256 } from "ethers";
import { Ok, Err, Result, encased, CredError, ErrorName, unwrap } from "@/errors";
import { ClaimDef, parseClaimDef } from "@/credential/claimType";
import type { TypeSpec } from "./credTypeUtils";
export * as primitiveTypes from "@/credential/primitiveTypes";
export * as utils from "./credTypeUtils";

export const MAX_REVOCABLE_TREE_DEPTH = 248;
export const MIN_REVOCABLE_TREE_DEPTH = 2;

/**
 * CredType represents a type of a credential.
 * It is a list of claim definitions and the typeID registered on-chain.
 */
export type CredType = {
  claims: ClaimDef[];
  revocable: number | null;
  typeID: bigint;
};

/**
 * Parse a string representation of a list of claim definitions.
 * @param str the string representation of a credential type.
 * @returns a CredType object, wrapped in Result<T>
 * @example
 * ```
 * const tp = parseCredType("name: string; age: uint<32>");
 * // tp.claims[0].name === "name"
 * // tp.claims[0].type.tp === ClaimTypeEnum.String
 * // tp.claims[1].name === "age"
 * // tp.claims[1].type.tp === ClaimTypeEnum.Scalar
 * // tp.claims[1].type.width === 32
 * // tp.revocable === null
 * // tp.TypeID === 0
 * ```
 *
 * @example
 * ```
 * const tp = parseCredType("name: string; age: uint<32>; @revocable(4)");
 * // tp.claims[0].name === "name"
 * // tp.claims[0].type.tp === ClaimTypeEnum.String
 * // tp.claims[1].name === "age"
 * // tp.claims[1].type.tp === ClaimTypeEnum.Scalar
 * // tp.claims[1].type.width === 32
 * // tp.revocable === 4
 * // tp.TypeID === 0
 * ```
 *
 * @example
 * ```
 * const tp = parseCredType("name: string; age: uint<32>; @revocable(4); @revocable(5)");
 * // Error: duplicate revocable pragma: @revocable(5)
 * ```
 *
 */
export function parseCredType(str: string): Result<CredType> {
  const shown = new Set<string>();
  const lines = str
    .split(";")
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);
  const claims = encased(() =>
    lines
      .filter((s: string) => !isPragma(s))
      .map((s: string): ClaimDef => {
        const d = unwrap(parseClaimDef(s));
        if (shown.has(d.name)) {
          throw new CredError(ErrorName.DuplicateClaimName, d.name);
        }
        shown.add(d.name);
        return d;
      })
  );
  if (!claims.ok) {
    return Err(claims.error);
  }
  const pragmas = encased(() => lines.filter((s: string) => isPragma(s)).map((s: string) => unwrap(parsePragma(s))));
  if (!pragmas.ok) {
    return Err(pragmas.error);
  }
  let revocable: number | null = null;
  // process pragmas, returns an error if any pragma is invalid.
  // TODO: refactor out when we have any other pragma.
  for (const pragma of pragmas.value) {
    const { name, values } = pragma;
    // just to satisfy the type checker
    if (values[0] === undefined) {
      return Err(new CredError(ErrorName.InvalidPragma, `no value in pragma: ${name}`));
    }
    switch (name) {
      case "revocable": {
        // value must be an integer, less than max, larger than min, and not duplicate
        if (values.length !== 1 || !values[0].match(/^[0-9]+$/)) {
          return Err(
            new CredError(ErrorName.InvalidPragma, `parameter is not an unsigned integer: @revocable(${values})`)
          );
        }
        const _revocable = parseInt(values[0]);
        if (_revocable > MAX_REVOCABLE_TREE_DEPTH) {
          return Err(
            new CredError(
              ErrorName.InvalidPragma,
              `revocable tree too large, max ${MAX_REVOCABLE_TREE_DEPTH}, got: ${_revocable}`
            )
          );
        }
        if (_revocable < MIN_REVOCABLE_TREE_DEPTH) {
          return Err(
            new CredError(
              ErrorName.InvalidPragma,
              `revocable tree too small, min ${MIN_REVOCABLE_TREE_DEPTH}, got: ${_revocable}`
            )
          );
        }
        if (revocable !== null) {
          return Err(new CredError(ErrorName.InvalidPragma, `duplicate revocable pragma: @revocable(${values})`));
        }
        revocable = _revocable;
        break;
      }
      default:
        return Err(new CredError(ErrorName.InvalidPragma, `unknown pragma: ${name}`));
    }
  }
  return Ok({
    claims: claims.value,
    revocable,
    typeID: BigInt(0),
  });
}

/**
 * Compute the typeID of a credential type.
 */
export function computeTypeID(creator: string, typename: string): bigint {
  // Compute the keccak256 hash of the concatenated data
  const fullHash = solidityPackedKeccak256(["address", "string"], [creator, typename]);
  // Truncate the hash to 160 bits
  return BigInt("0x" + fullHash.slice(-40));
}

/**
 * createTypeFromSpec creates a CredType from a TypeSpec
 */
export function createTypeFromSpec(spec: TypeSpec): Result<CredType> {
  return encased(() => {
    const tp = unwrap(parseCredType(spec.definition));
    tp.typeID = spec.type_id;
    return tp;
  });
}

// Pragma is an internal representation of a pragma.
type Pragma = {
  name: string;
  values: string[];
};

function isPragma(s: string): boolean {
  return s.startsWith("@");
}

function parsePragma(s: string): Result<Pragma> {
  // regex match @name(value1, value2, ...)
  // @name is a sequence of alphanumeric characters and underscores
  // values are separated by commas
  const re = /^@([a-zA-Z0-9_]+)\((.*)\)$/;
  const match = s.match(re);
  if (!match) {
    return Err(new CredError(ErrorName.InvalidPragma, s));
  }
  const [, name, valuesStr] = match;
  if (valuesStr == undefined || name == undefined) {
    throw new CredError(ErrorName.InvalidPragma, `no value or name in pragma: ${s}`);
  }
  const values = valuesStr.split(",").map((s: string) => s.trim());
  return Ok({ name, values });
}
