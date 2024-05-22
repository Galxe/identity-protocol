import { beforeAll, describe, expect, it } from "vitest";
import { babyzk } from "../babyzk";
import { parse } from "./query";
import { Err, CredError, ErrorName } from "../errors";

describe("query", () => {
  beforeAll(async () => {
    await babyzk.prepare();
  });
  it("correct json", async () => {
    const cases: string[] = [
      `
      {
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
      `
      {
        "conditions": [],
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
      `
      {
        "conditions": [
          {
            "identifier": "score",
            "operation": "IN",
            "value": {
              "from": "50",
              "to": "100"
            }
          }
        ],
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
      `
      {
        "conditions": [
          {
            "identifier": "verified",
            "operation": "REVEAL"
          }
        ],
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
      `
      {
        "conditions": [
          {
            "identifier": "val",
            "operation": "IS",
            "value": ["777"]
          }
        ],
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
    ];
    for (const c of cases) {
      const query = parse(c);
      expect(query).toBeDefined();
    }
  });

  it("missing required options", async () => {
    const cases = [
      {
        input: `
      {}
      `,
        output: new CredError(ErrorName.InvalidQuery, "missing required options"),
      },
      {
        input: `
      {
        "options": {}
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "missing required options"),
      },
      {
        input: `
      {
        "options": {
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "missing required options"),
      },
      {
        input: `
      {
        "options": {
          "expiredAtLowerBound": "1672531199",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "missing required options"),
      },
      {
        input: `
      {
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "missing required options"),
      },
      {
        input: `
      {
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0"
        }
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "missing required options"),
      },
    ];
    for (const c of cases) {
      expect(parse(c.input)).toEqual(Err(c.output));
    }
  });

  it("invalid conditions", async () => {
    const cases = [
      {
        input: `
      {
        "conditions": [
          {
            "identifier": "val",
            "operation": "IS",
            "value": ["abc"]
          }
        ],
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "invalid set for IS operation"),
      },
      {
        input: `
      {
        "conditions": [
          {
            "identifier": "val",
            "operation": "IS",
            "value": {
              "from": "50",
              "to": "100"
            }
          }
        ],
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "invalid set value for IS operation"),
      },
      {
        input: `
      {
        "conditions": [
          {
            "identifier": "val",
            "operation": "IN",
            "value": {
              "from": "50"
            }
          }
        ],
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "missing range for IN operation"),
      },
      {
        input: `
      {
        "conditions": [
          {
            "identifier": "val",
            "operation": "IN",
            "value": {
              "from": "50",
              "to": "a"
            }
          }
        ],
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "invalid range for IN operation"),
      },
      {
        input: `
      {
        "conditions": [
          {
            "identifier": "val",
            "operation": "IN",
            "value": ["1"]
          }
        ],
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "missing range for IN operation"),
      },
      {
        input: `
      {
        "conditions": [
          {
            "identifier": "val",
            "operation": "REVEALL"
          }
        ],
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "unsupported operation"),
      },
      {
        input: `
      {
        "conditions": [
          {
            "identifier": "val",
            "operation": "HIDEE"
          }
        ],
        "options": {
          "expiredAtLowerBound": "1672531199",
          "externalNullifier": "12345",
          "equalCheckId": "0",
          "pseudonym": "0xdeadbeef"
        }
      }
      `,
        output: new CredError(ErrorName.InvalidQuery, "unsupported operation"),
      },
      {
        input: `
        {
          "conditions": [
            {
              "identifier": "val",
              "operation": "IS",
              "value": ["777"]
            },
            {
              "identifier": "val",
              "operation": "IS",
              "value": ["888"]
            }
          ],
          "options": {
            "expiredAtLowerBound": "1672531199",
            "externalNullifier": "12345",
            "equalCheckId": "0",
            "pseudonym": "0xdeadbeef"
          }
        }
        `,
        output: new CredError(ErrorName.InvalidQuery, "duplicated identifier"),
      },
    ];
    for (const c of cases) {
      expect(parse(c.input)).toEqual(Err(c.output));
    }
  });
});
