import { describe, expect, it } from "vitest";
import { Ok } from "../errors";

import { ScalarValue, BoolValue, PropValue, MarshaledClaimValue, ClaimValue } from "./claimValue";
import { ScalarType, BoolType, PropType, PropHashEnum, parseClaimType, parseClaimDef, ClaimType } from "./claimType";

describe("parse claim", () => {
  it("parse claim type", async () => {
    const tests = [
      {
        input: "uint<256>",
        output: new ScalarType(256),
      },
      {
        input: "uint<     8>",
        output: new ScalarType(8),
      },
      {
        input: "bool",
        output: new BoolType(),
      },
      {
        input: "prop<\t8\t,  k  >",
        output: new PropType(8, PropHashEnum.Keccak256),
      },
      {
        input: "prop<\t8\t,  p,       5  >",
        output: new PropType(8, PropHashEnum.Poseidon, 5),
      },
      {
        input: "prop<  16  ,c >",
        output: new PropType(16, PropHashEnum.Custom),
      },
    ];
    for (const test of tests) {
      expect(parseClaimType(test.input), test.input).toEqual(Ok(test.output));
    }
  });
  it("parse claim def", async () => {
    const tests = [
      {
        input: "age:uint<256>",
        output: {
          name: "age",
          type: new ScalarType(256),
        },
      },
      {
        input: "wealth:uint<8>",
        output: {
          name: "wealth",
          type: new ScalarType(8),
        },
      },
      {
        input: "followed:bool",
        output: {
          name: "followed",
          type: new BoolType(),
        },
      },
      {
        input: "name:prop<8,k>",
        output: {
          name: "name",
          type: new PropType(8, PropHashEnum.Keccak256),
        },
      },
      {
        input: "nati0nality:prop<16,c>",
        output: {
          name: "nati0nality",
          type: new PropType(16, PropHashEnum.Custom),
        },
      },
    ];
    for (const test of tests) {
      expect(parseClaimDef(test.input), test.input).toEqual(Ok(test.output));
    }
  });
  it("from JSON object", async () => {
    const tests: { name: string; input: { tp: ClaimType; val: MarshaledClaimValue }; output: ClaimValue }[] = [
      {
        name: "scalar",
        input: {
          tp: new ScalarType(256),
          val: "1000",
        },
        output: new ScalarValue(new ScalarType(256), BigInt(1000)),
      },
      {
        name: "property",
        input: {
          tp: new PropType(8, PropHashEnum.Custom),
          val: {
            str: "haha",
            value: "66",
          },
        },
        output: new PropValue(new PropType(8, PropHashEnum.Custom), "haha", 66n),
      },
      {
        name: "bool",
        input: {
          tp: new BoolType(),
          val: "true",
        },
        output: new BoolValue(true),
      },
    ];
    for (const test of tests) {
      expect(test.input.tp.create(test.input.val), test.name).toEqual(test.output);
    }
  });
});
