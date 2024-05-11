import { describe, expect, it } from "vitest";
// import { Ok } from "../errors";

import { ScalarType, PropType, PropHashEnum } from "./claimType";
import { ScalarValue, BoolValue, PropValue } from "./claimValue";

describe("Claim Value", () => {
  it("to JSON object", async () => {
    const tests = [
      {
        name: "scalar",
        input: new ScalarValue(new ScalarType(256), BigInt(100)),
        output: "100",
      },
      {
        name: "scalar2",
        input: new ScalarValue(new ScalarType(8), BigInt(200)),
        output: "200",
      },
      {
        name: "bool",
        input: new BoolValue(true),
        output: "true",
      },
      {
        name: "property",
        input: new PropValue(new PropType(8, PropHashEnum.Custom), "bool boy", BigInt(2)),
        output: {
          str: "bool boy",
          value: "2",
        },
      },
      // add more tests
    ];
    for (const test of tests) {
      expect(test.input.toJSON(), test.name).toEqual(test.output);
    }
  });
  it("to values", async () => {
    // TODO: add more tests
  });
  it("to strValues", async () => {
    // TODO: add more tests
  });
});
