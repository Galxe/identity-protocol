import { describe, expect, it } from "vitest";
import { BoolStatement, PropStatement, ScalarStatement, StatementList } from "./statement";
import { exampleStatementList } from "../testutils";
import { BoolType, PropHashEnum, PropType, ScalarType } from "./claimType";
import { JSONStringifyBigInts } from "../utils";

describe("statements toJSON/fromJSON", () => {
  it("fromJSON failure", async () => {
    const tests = [
      {
        // no expirationLb
        input: `{"idEqualsTo":"1","statements":[]}`,
        output: {
          error: `expirationLb, idEqualsTo or statements is missing`,
        },
      },
      {
        // no idEqualsTo
        input: `{"expirationLb":"10","statements":[]}`,
        output: {
          error: `expirationLb, idEqualsTo or statements is missing`,
        },
      },
      {
        // no statements
        input: `{"expirationLb":"10","idEqualsTo":"1"}`,
        output: {
          error: `expirationLb, idEqualsTo or statements is missing`,
        },
      },
      // tp
      {
        // no tp
        input: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"no-tp":{"tp":"bool","width":8},"reveal":true}]}`,
        output: {
          error: `statement claim type is missing`,
        },
      },
      // tp.tp
      {
        // no tp.tp
        input: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"no-tp":"bool","width":8},"reveal":true}]}`,
        output: {
          error: `statement claim type enum or width is missing`,
        },
      },
      {
        // wrong tp.tp
        input: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"unknown","width":8},"reveal":true}]}`,
        output: {
          error: `unknown statement type unknown`,
        },
      },
      {
        // no tp.width
        input: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"bool","no-width":8},"reveal":true}]}`,
        output: {
          error: `statement claim type enum or width is missing`,
        },
      },
      // scalar
      {
        // no lowerBound
        input: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"uint","width":256},"no-lowerBound":"50","upperBound":"101"}]}`,
        output: {
          error: `statement scalar lowerBound or upperBound is missing`,
        },
      },
      {
        // no upperBound
        input: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"uint","width":256},"lowerBound":"50","no-upperBound":"101"}]}`,
        output: {
          error: `statement scalar lowerBound or upperBound is missing`,
        },
      },
      // prop
      {
        // no hashAlgorithm
        input: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"prop","width":8,"no-hashAlgorithm":"c","nEqualChecks":2},"equalsTo":["3","4"]}]}`,
        output: {
          error: `statement prop lowerBound or equalsTo is missing`,
        },
      },
      {
        // wrong hashAlgorithm
        input: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"prop","width":8,"hashAlgorithm":"x","nEqualChecks":2},"equalsTo":["3","4"]}]}`,
        output: {
          error: `unknown hash algorithm x`,
        },
      },
      {
        // no nEqualChecks
        input: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"prop","width":8,"hashAlgorithm":"c","no-nEqualChecks":2},"equalsTo":["3","4"]}]}`,
        output: {
          error: `invalid Property equalsTo length 2 != 1`,
        },
      },
      {
        // no equalsTo
        input: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"prop","width":8,"hashAlgorithm":"c","nEqualChecks":2},"no-equalsTo":["3","4"]}]}`,
        output: {
          error: `statement prop lowerBound or equalsTo is missing`,
        },
      },
      // bool
      {
        // no reveal
        input: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"bool","width":8},"no-reveal":true}]}`,
        output: {
          error: `statement bool reveal is missing`,
        },
      },
    ];

    for (const test of tests) {
      expect(() => StatementList.fromJSON(JSON.parse(test.input))).to.throw(test.output.error);
    }
  });
  it("toJSON/fromJSON success", async () => {
    const tests = [
      {
        input: exampleStatementList(),
        output: `{"expirationLb":"99","idEqualsTo":"9","statements":[{"tp":{"tp":"uint","width":256},"lowerBound":"50","upperBound":"101"},{"tp":{"tp":"uint","width":64},"lowerBound":"199","upperBound":"201"},{"tp":{"tp":"prop","width":8,"hashAlgorithm":"c","nEqualChecks":2},"equalsTo":["3","4"]},{"tp":{"tp":"bool","width":8},"reveal":true}]}`,
      },
      {
        input: new StatementList(10n, 1n, []),
        output: `{"expirationLb":"10","idEqualsTo":"1","statements":[]}`,
      },
      {
        input: new StatementList(10n, 1n, [new ScalarStatement(new ScalarType(256), 50n, 101n)]),
        output: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"uint","width":256},"lowerBound":"50","upperBound":"101"}]}`,
      },
      {
        input: new StatementList(10n, 1n, [new PropStatement(new PropType(8, PropHashEnum.Custom, 2), [3n, 4n])]),
        output: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"prop","width":8,"hashAlgorithm":"c","nEqualChecks":2},"equalsTo":["3","4"]}]}`,
      },
      {
        input: new StatementList(10n, 1n, [new BoolStatement(new BoolType(), true)]),
        output: `{"expirationLb":"10","idEqualsTo":"1","statements":[{"tp":{"tp":"bool","width":8},"reveal":true}]}`,
      },
    ];

    for (const test of tests) {
      // test toJSON
      const json = test.input.toJSON();
      expect(JSONStringifyBigInts(json)).toEqual(test.output);

      // test fromJSON
      const statementsFromJson = StatementList.fromJSON(json);
      expect(statementsFromJson).deep.equal(test.input);
      expect(statementsFromJson.toJSON()).deep.equal(json);
    }
  });
});
