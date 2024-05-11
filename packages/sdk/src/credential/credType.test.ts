import { describe, expect, it } from "vitest";
import * as credType from "./credType";
import * as claim from "./claimType";
import { Ok, Err, CredError, ErrorName } from "../errors";

describe("compute type id", () => {
  it("compute type id", async () => {
    // uint160(uint256(keccak256(abi.encodePacked(msg.sender, "SuperType"))));
    const tests = [
      {
        input: {
          creator: "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
          typename: "SuperType",
        },
        output: BigInt("1373315977952188719538328827245433171644805209404"),
      },
    ];
    for (const test of tests) {
      expect(credType.computeTypeID(test.input.creator, test.input.typename)).toEqual(test.output);
    }
  });
});

describe("parse type", () => {
  it("incorrect pragmas", async () => {
    const tests = [
      {
        name: "tree too large",
        input: "@revocable(249) ;age:uint<256>;",
        output: new CredError(ErrorName.InvalidPragma, "revocable tree too large, max 248, got: 249"),
      },
      {
        name: "tree too small",
        input: "@revocable(1) ;age:uint<256>;",
        output: new CredError(ErrorName.InvalidPragma, "revocable tree too small, min 2, got: 1"),
      },
      {
        name: "unknown pragma",
        input: "@dota(4) ;age:uint<256>;",
        output: new CredError(ErrorName.InvalidPragma, "unknown pragma: dota"),
      },
      {
        name: "wrong parameter: too many",
        input: "@revocable(33, 44)",
        output: new CredError(ErrorName.InvalidPragma, "parameter is not an unsigned integer: @revocable(33,44)"),
      },
      {
        name: "wrong parameter: not natural number",
        input: "@revocable(-1)",
        output: new CredError(ErrorName.InvalidPragma, "parameter is not an unsigned integer: @revocable(-1)"),
      },
      {
        name: "wrong parameter: string",
        input: '@revocable("1")',
        output: new CredError(ErrorName.InvalidPragma, 'parameter is not an unsigned integer: @revocable("1")'),
      },
    ];
    for (const test of tests) {
      expect(credType.parseCredType(test.input)).toEqual(Err(test.output));
    }
  });

  it("multiple claims", async () => {
    const tests = [
      {
        input: "age:uint<256>;\nwealth:uint<8 >;followed : bool;",
        output: {
          revocable: null,
          typeID: BigInt(0),
          claims: [
            {
              name: "age",
              type: new claim.ScalarType(256),
            },
            {
              name: "wealth",
              type: new claim.ScalarType(8),
            },
            {
              name: "followed",
              type: new claim.BoolType(),
            },
          ],
        },
      },
      {
        input: "@revocable( 4) ;age:uint<256>;",
        output: {
          revocable: 4,
          typeID: BigInt(0),
          claims: [
            {
              name: "age",
              type: new claim.ScalarType(256),
            },
          ],
        },
      },
    ];
    for (const test of tests) {
      expect(credType.parseCredType(test.input)).toEqual(Ok(test.output));
    }
  });
});
