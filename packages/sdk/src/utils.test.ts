import { describe, expect, it } from "vitest";
import { sortedJSONString } from "./utils";

describe("sort", () => {
  it("should sort result", async () => {
    const a = {
      b: 1,
      a: 2,
    };
    expect(sortedJSONString(a)).toEqual('{"a":2,"b":1}');
  });
  it("should sort result 2", async () => {
    const a: { [key: string]: string } = {};
    a["2"] = "hahaj";
    a["1"] = "hehihi";
    expect(sortedJSONString(a)).toEqual('{"1":"hehihi","2":"hahaj"}');
  });
});
