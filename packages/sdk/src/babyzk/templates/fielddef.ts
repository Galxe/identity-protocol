import { Eta } from "@/site-packages/eta/browser.js";
import { ClaimTypeEnum, ClaimType, ClaimDef, PropType } from "@/credential/claimType";
import { PublicSignalDef, Aggregation, AggregationMode as AggMode } from "@/credential/credential";
import { CredError, ErrorName } from "@/errors";

/**
 * FieldDef is a field definition in a credential type.
 * It maps a claim definition to signals in the circom circuit.
 * This is the most important utility class for generating the circom circuit.
 */
export class FieldDef {
  /**
   * FieldDef is a field (claim) definition in a credential type.
   *
   * @param name the name of the field
   * @param originalType the original claim type
   * @param inputSignals the name of the input signals
   * @param opPrivateSignals the name of the private signals used in the check operation
   * @param outputSignals the the output signals
   */
  constructor(
    public name: string,
    public originalType: ClaimType,
    public inputSignals: string[],
    public opPrivateSignals: string[],
    public outputSignals: PublicSignalDef[]
  ) {}

  /**
   * aggregations returns the aggregation operations for this field in solidity.
   *
   * @returns all the aggregation operations required for the field.
   */
  public aggregations(): Aggregation[] {
    switch (this.originalType.tp) {
      case ClaimTypeEnum.Scalar: {
        switch (this.originalType.width) {
          case 256: {
            if (this.outputSignals.length !== 4) {
              throw new CredError(
                ErrorName.InternalError,
                `opPublicSignals length is ${this.outputSignals.length}, expected 4`
              );
            }
            return [
              new Aggregation({
                destName: `agg_${this.name}_lb`,
                destType: "uint256",
                srcNames: [this.outputSignals[0]?.name as string, this.outputSignals[1]?.name as string],
                mode: AggMode.TakeGreaterUint256,
              }),
              new Aggregation({
                destName: `agg_${this.name}_ub`,
                destType: "uint256",
                srcNames: [this.outputSignals[2]?.name as string, this.outputSignals[3]?.name as string],
                mode: AggMode.TakeLessUint256,
              }),
            ];
          }
          default: {
            if (this.outputSignals.length !== 2) {
              throw new CredError(
                ErrorName.InternalError,
                `opPublicSignals length is ${this.outputSignals.length}, expected 2`
              );
            }
            return [
              new Aggregation({
                destName: `agg_${this.name}_lb`,
                destType: `uint${this.originalType.width}`,
                srcNames: [this.outputSignals[0]?.name as string],
                mode: AggMode.TakeGreater,
              }),
              new Aggregation({
                destName: `agg_${this.name}_ub`,
                destType: `uint${this.originalType.width}`,
                srcNames: [this.outputSignals[1]?.name as string],
                mode: AggMode.TakeLess,
              }),
            ];
          }
        }
      }
      case ClaimTypeEnum.Property: {
        const propDef = this.originalType as PropType;
        if (this.outputSignals.length !== propDef.nEqualChecks) {
          throw new CredError(
            ErrorName.InternalError,
            `outputSignals length is ${this.outputSignals.length}, expected ${propDef.nEqualChecks}`
          );
        }
        return this.outputSignals.map(s => {
          return new Aggregation({
            destName: `agg_${this.name}`,
            destType: `mapping(uint${propDef.width} => uint8)`,
            srcNames: [s.name],
            mode: AggMode.MergeUnlessEq,
          });
        });
      }
      case ClaimTypeEnum.Boolean:
        if (this.outputSignals.length !== 1) {
          throw new CredError(
            ErrorName.InternalError,
            `outputSignals length is ${this.outputSignals.length}, expected 1`
          );
        }
        return [
          new Aggregation({
            destName: `agg_${this.name}`,
            destType: "uint8",
            srcNames: [this.outputSignals[0]?.name as string],
            mode: AggMode.SetIfRevealed,
          }),
        ];
      default:
        throw new Error(`unknown claim type ${this.originalType.tp}`);
    }
  }
}

/**
 * FieldDefList is a list of field definitions in a credential type.
 * It is used to make generating the circom circuit easier.
 */
export class FieldDefList {
  public defs: FieldDef[];

  constructor(defList: FieldDef[]) {
    this.defs = defList;
  }

  public inputs(): string[] {
    return this.defs.flatMap(def => def.inputSignals);
  }

  public ops(): string[] {
    return this.opPrivateSignals();
  }

  public opPrivateSignals(): string[] {
    return this.defs.flatMap(def => def.opPrivateSignals);
  }

  public outputs(): string[] {
    return this.defs.flatMap(def => def.outputSignals.map(s => s.name));
  }

  /**
   * codes returns the generated circom code for all the check operations.
   * @returns generated circom code for all the check operations.
   */
  public codes(): string[] {
    return this.defs.flatMap(def => genCheckOperationCode(def));
  }
}

/**
 * genFieldDef generates a FieldDef from a ClaimDef.
 */
export function genFieldDef(d: ClaimDef): FieldDef {
  switch (d.type.tp) {
    case ClaimTypeEnum.Scalar:
      switch (d.type.width) {
        case 256:
          return new FieldDef(
            d.name,
            d.type,
            [`${d.name}_msb`, `${d.name}_lsb`],
            [`${d.name}_lb_msb`, `${d.name}_lb_lsb`, `${d.name}_ub_msb`, `${d.name}_ub_lsb`],
            [
              {
                name: `out_${d.name}_lb_msb`,
                ceiling: BigInt(1) << BigInt(128),
              },
              {
                name: `out_${d.name}_lb_lsb`,
                ceiling: BigInt(1) << BigInt(128),
              },
              {
                name: `out_${d.name}_ub_msb`,
                ceiling: BigInt(1) << BigInt(128),
              },
              {
                name: `out_${d.name}_ub_lsb`,
                ceiling: BigInt(1) << BigInt(128),
              },
            ]
          );
        default:
          return new FieldDef(
            d.name,
            d.type,
            [`${d.name}`],
            [`${d.name}_lb`, `${d.name}_ub`],
            [
              {
                name: `out_${d.name}_lb`,
                ceiling: BigInt(1) << BigInt(d.type.width),
              },
              {
                name: `out_${d.name}_ub`,
                ceiling: BigInt(1) << BigInt(d.type.width),
              },
            ]
          );
      }
    case ClaimTypeEnum.Property: {
      const propDef = d.type as PropType;
      // generate "nEqualChecks" equals_to fields.
      const opPrivateSignals = Array.from({ length: propDef.nEqualChecks }, (_, i) => {
        return `${d.name}_eq_check${i}`;
      });
      return new FieldDef(
        d.name,
        d.type,
        [`${d.name}`],
        opPrivateSignals,
        Array.from({ length: propDef.nEqualChecks }, (_, i) => {
          return {
            name: `out_${d.name}_eq${i}`,
            ceiling: BigInt(1) << BigInt(propDef.width + 1),
          };
        })
      );
    }
    case ClaimTypeEnum.Boolean:
      return new FieldDef(
        d.name,
        d.type,
        [`${d.name}`],
        [`${d.name}_hide`],
        [{ name: `out_${d.name}`, ceiling: BigInt(4) }]
      );
    default:
      throw new Error(`unknown claim type ${d.type.tp}`);
  }
}

/**
 * genCheckOperationCode generates the circom code for a check operation.
 */
function genCheckOperationCode(d: FieldDef): string {
  const eta = new Eta({
    autoEscape: false,
  });
  switch (d.originalType.tp) {
    case ClaimTypeEnum.Scalar:
      switch (d.originalType.width) {
        case 256:
          return eta.renderString(scalar256RangeCheckOpTemplate, d);
        default:
          return eta.renderString(scalarRangeCheckOpTemplate, d);
      }
    case ClaimTypeEnum.Property:
      return eta.renderString(propEqualityCheckOpTemplate, d);
    case ClaimTypeEnum.Boolean:
      return eta.renderString(booleanCheckOpTemplate, d);
    default:
      throw new Error(`unknown claim type ${d.originalType.tp}`);
  }
}

const scalar256RangeCheckOpTemplate = `
  component <%=it.name%>_range_check = Scalar256RangeChecker();
  <%=it.name%>_range_check.in_msb <== <%=it.inputSignals[0]%>;
  <%=it.name%>_range_check.in_lsb <== <%=it.inputSignals[1]%>;
  <%=it.name%>_range_check.lower_bound_msb <== <%=it.opPrivateSignals[0]%>;
  <%=it.name%>_range_check.lower_bound_lsb <== <%=it.opPrivateSignals[1]%>;
  <%=it.name%>_range_check.upper_bound_msb <== <%=it.opPrivateSignals[2]%>;
  <%=it.name%>_range_check.upper_bound_lsb <== <%=it.opPrivateSignals[3]%>;
  <%=it.outputSignals[0].name%> <== <%=it.opPrivateSignals[0]%>; 
  <%=it.outputSignals[1].name%> <== <%=it.opPrivateSignals[1]%>; 
  <%=it.outputSignals[2].name%> <== <%=it.opPrivateSignals[2]%>; 
  <%=it.outputSignals[3].name%> <== <%=it.opPrivateSignals[3]%>; 
`;

const scalarRangeCheckOpTemplate = `
  component <%=it.name%>_range_check = ScalarRangeChecker(<%= it.originalType.width %>);
  <%=it.name%>_range_check.in <== <%=it.inputSignals[0]%>;
  <%=it.name%>_range_check.lower_bound <== <%=it.opPrivateSignals[0]%>;
  <%=it.name%>_range_check.upper_bound <== <%=it.opPrivateSignals[1]%>;
  <%=it.outputSignals[0].name%> <== <%=it.opPrivateSignals[0]%>; 
  <%=it.outputSignals[1].name%> <== <%=it.opPrivateSignals[1]%>; 
`;

const propEqualityCheckOpTemplate = `
  component <%=it.name%>_eq_check = PropertyEqualityChecker(<%= it.opPrivateSignals.length %>);
  <%=it.name%>_eq_check.in <== <%=it.inputSignals[0]%>;
  <% it.opPrivateSignals.forEach(function(v, i){ _%>
  <%=it.name%>_eq_check.equals_to[<%= i %>] <== <%=v%>;
  <% }) _%>
  <% it.outputSignals.forEach(function(v, i){ _%>
  <%=v.name%> <== <%=it.name%>_eq_check.out[<%=i%>];
  <% }) _%>
`;

const booleanCheckOpTemplate = `
  component <%=it.name%>_check = BooleanChecker();
  <%=it.name%>_check.in <== <%=it.inputSignals[0]%>;
  <%=it.name%>_check.hide <== <%=it.opPrivateSignals[0]%>;
  <%=it.outputSignals[0].name%> <== <%=it.name%>_check.out;
`;
