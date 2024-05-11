import { Result, Ok, Err, ErrorName, CredError } from "@/errors";
import {
  ClaimType,
  PropType,
  ScalarType,
  BoolType,
  PropHashEnum,
  ClaimTypeEnum,
  makePropertyHashAlgorithm,
} from "@/credential/claimType";
import { ClaimValue } from "@/credential/claimValue";
import { Body } from "@/credential/credential";

export abstract class Statement {
  /**
   * The type of the statement.
   */
  constructor(public tp: ClaimType) {
    this.tp = tp;
  }

  abstract check(v: ClaimValue): Result<bigint[]>;
}

/**
 * Scalar statement.
 * @param lowerBound of the scalar, inclusive.
 * @param upperBound of the scalar, inclusive.
 */
export class ScalarStatement extends Statement {
  constructor(tp: ScalarType, public lowerBound: bigint, public upperBound: bigint) {
    super(tp);
    if (lowerBound > upperBound) {
      throw new CredError(
        ErrorName.InvalidTypeParameter,
        `invalid Scalar bounds lower bound ${lowerBound} is larger than upper bound ${upperBound}`
      );
    }
    if (this.isOverflow(lowerBound)) {
      throw new CredError(ErrorName.InvalidTypeParameter, `out-of-range Scalar lower bound ${lowerBound}`);
    }
    if (this.isOverflow(upperBound)) {
      throw new CredError(ErrorName.InvalidTypeParameter, `out-of-range Scalar upper bound ${upperBound}`);
    }
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
  }

  // Validate that the provided value fits within the width of the Property type
  private isOverflow(v: bigint): boolean {
    const maxValue = BigInt(2 ** (this.tp as ScalarType).width) - BigInt(1);
    return v < 0 || v > maxValue;
  }

  public override check(v: ClaimValue): Result<bigint[]> {
    if (!v.type.equal(this.tp)) {
      return Err(
        new CredError(ErrorName.InvalidStatementCheck, `type mismatch ${v.type.toString()} != ${this.tp.toString()}`)
      );
    }
    const values = v.value();
    let originalValue = BigInt(0);
    if (this.tp.width === 256) {
      const [msb, lsb] = values;
      if (msb == undefined || lsb == undefined) {
        return Err(new CredError(ErrorName.InvalidStatementCheck, `invalid 256-bit scalar value ${values}`));
      }
      originalValue = (msb << BigInt(128)) + lsb;
    } else {
      originalValue = values[0] as bigint;
    }
    if (originalValue >= this.lowerBound && originalValue <= this.upperBound) {
      return Ok([]);
    } else {
      return Err(
        new CredError(
          ErrorName.InvalidStatementCheck,
          `Scalar ${originalValue} is not within range [${this.lowerBound}, ${this.upperBound}]`
        )
      );
    }
  }
}

/**
 * Property statement.
 * @param tp of the property.
 * @param equalsTo values to be checked.
 */
export class PropStatement extends Statement {
  constructor(tp: PropType, public equalsTo: bigint[]) {
    super(tp);
    if (tp.nEqualChecks !== equalsTo.length) {
      throw new CredError(
        ErrorName.InvalidStatementCheck,
        `invalid Property equalsTo length ${equalsTo.length} != ${tp.nEqualChecks}`
      );
    }
    this.equalsTo = equalsTo;
  }

  public override check(v: ClaimValue): Result<bigint[]> {
    if (!v.type.equal(this.tp)) {
      return Err(new CredError(ErrorName.InvalidStatementCheck, `type mismatch ${v.type} != ${this.tp}`));
    }
    for (const e of this.equalsTo) {
      if (v.value()[0] === e) {
        return Ok([BigInt(1)]);
      }
    }
    return Ok([BigInt(0)]);
  }
}

/**
 * Bool statement.
 * @param whether to reveal the bool.
 */
export class BoolStatement extends Statement {
  constructor(tp: BoolType, public reveal: boolean) {
    super(tp);
    this.reveal = reveal;
  }

  public override check(v: ClaimValue): Result<bigint[]> {
    if (!v.type.equal(this.tp)) {
      return Err(new CredError(ErrorName.InvalidStatementCheck, `type mismatch ${v.type} != ${this.tp}`));
    }
    if (this.reveal) {
      return Ok(v.value());
    }
    return Ok([]);
  }
}

export class StatementList {
  public expirationLb: ScalarStatement;
  public idEqualsTo: PropStatement;
  public statements: Statement[];

  constructor(expirationLb: bigint, idEqualsTo: bigint, statements: Statement[]) {
    this.expirationLb = new ScalarStatement(new ScalarType(64), expirationLb, (BigInt(1) << BigInt(64)) - BigInt(1));
    this.idEqualsTo = new PropStatement(new PropType(8, PropHashEnum.Custom), [idEqualsTo]);
    this.statements = statements;
  }

  public checkBody(body: Body): Result<{ [key: string]: bigint[] }> {
    const values = body.values;
    if (values.length !== this.statements.length) {
      return Err(
        new CredError(
          ErrorName.InvalidStatementCheck,
          `statement count mismatch: ${values.length} != ${this.statements.length}`
        )
      );
    }
    const rst: { [key: string]: bigint[] } = {};
    for (let i = 0; i < values.length; i++) {
      const rv = this.statements[i]?.check(values[i] as ClaimValue);
      if (!rv?.ok) {
        return Err(
          new CredError(
            ErrorName.InvalidStatementCheck,
            `statement check failed when check claim "${body.tp.claims[i]?.name}": ${rv?.error}`
          )
        );
      }
      rst[body.tp.claims[i]?.name as string] = rv.value;
    }
    return Ok(rst);
  }

  public toJSON() {
    return {
      expirationLb: this.expirationLb.lowerBound.toString(),
      idEqualsTo: this.idEqualsTo.equalsTo[0]?.toString(),
      statements: this.statements,
    };
  }

  static fromJSON(json: { [key: string]: unknown }): StatementList {
    if (!json.expirationLb || !json.idEqualsTo || !json.statements) {
      throw new CredError(ErrorName.InvalidStatementCheck, `expirationLb, idEqualsTo or statements is missing`);
    }
    const expirationLb = BigInt(json.expirationLb as string);
    const idEqualsTo = BigInt(json.idEqualsTo as string);
    const stmts = json.statements as { [key: string]: unknown }[];
    const statements = stmts.map((s: { [key: string]: unknown }) => {
      if (!s.tp) {
        throw new CredError(ErrorName.InvalidStatementCheck, `statement claim type is missing`);
      }
      const statementClaimType = s.tp as { [key: string]: unknown };
      if (!statementClaimType.width || !statementClaimType.tp) {
        throw new CredError(ErrorName.InvalidStatementCheck, `statement claim type enum or width is missing`);
      }
      switch (statementClaimType.tp) {
        case ClaimTypeEnum.Scalar.toString():
          if (!s.lowerBound || !s.upperBound) {
            throw new CredError(
              ErrorName.InvalidStatementCheck,
              `statement scalar lowerBound or upperBound is missing`
            );
          }
          return new ScalarStatement(
            new ScalarType(statementClaimType.width as number),
            BigInt(s.lowerBound as string),
            BigInt(s.upperBound as string)
          );
        case ClaimTypeEnum.Property.toString():
          if (!statementClaimType.hashAlgorithm || !s.equalsTo) {
            throw new CredError(ErrorName.InvalidStatementCheck, `statement prop lowerBound or equalsTo is missing`);
          }
          return new PropStatement(
            new PropType(
              statementClaimType.width as number,
              makePropertyHashAlgorithm(statementClaimType.hashAlgorithm as string),
              (statementClaimType.nEqualChecks as number) || 1
            ),
            (s.equalsTo as string[]).map((e: string) => BigInt(e))
          );
        case ClaimTypeEnum.Boolean.toString():
          if (!s.reveal) {
            throw new CredError(ErrorName.InvalidStatementCheck, `statement bool reveal is missing`);
          }
          return new BoolStatement(new BoolType(), s.reveal as boolean);
        default:
          throw new CredError(
            ErrorName.InvalidStatementCheck,
            `unknown statement type ${statementClaimType.tp as string}`
          );
      }
    });
    return new StatementList(expirationLb, idEqualsTo, statements);
  }
}
