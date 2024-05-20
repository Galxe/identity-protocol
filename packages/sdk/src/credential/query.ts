/* eslint-disable @typescript-eslint/no-explicit-any */
import { CredError, ErrorName, Result, Err, Ok, unwrap, encased } from "@/errors";

export type Range = {
  from: bigint;
  to: bigint;
};

export type Set = bigint[];

type condition = {
  identifier: string;
  operation: "IN" | "REVEAL" | "HIDE" | "IS";
  value?: Range | Set;
};

type options = {
  expiredAtLowerBound: bigint;
  externalNullifier: bigint;
  equalCheckId: bigint;
  pseudonym: bigint;
};

export type Query = {
  conditions: condition[];
  options: options;
};

export function parse(jsonString: string): Result<Query> {
  // Parse the JSON string
  let json: any;
  try {
    json = JSON.parse(jsonString);
  } catch (error) {
    return Err(new CredError(ErrorName.InvalidQuery, "invalid JSON string"));
  }

  // Ensure the JSON has the required properties
  if (
    !json.options ||
    typeof json.options.expiredAtLowerBound !== "string" ||
    typeof json.options.externalNullifier !== "string" ||
    typeof json.options.equalCheckId !== "string" ||
    typeof json.options.pseudonym !== "string"
  ) {
    return Err(new CredError(ErrorName.InvalidQuery, "missing required options"));
  }

  const options: options = {
    expiredAtLowerBound: json.options.expiredAtLowerBound,
    externalNullifier: json.options.externalNullifier,
    equalCheckId: json.options.equalCheckId,
    pseudonym: json.options.pseudonym,
  };

  if (!json.conditions) {
    return Ok({ conditions: [], options });
  }

  // Parse and validate each condition
  const conditions: Result<condition[], Error> = encased(() =>
    json.conditions.map((expr: any) => unwrap(parseCondition(expr)))
  );
  if (!conditions.ok) {
    return Err(conditions.error);
  }

  // Check for duplicated identifier
  const ids = new Set<string>();
  for (const c of conditions.value) {
    if (ids.has(c.identifier)) {
      return Err(new CredError(ErrorName.InvalidQuery, "duplicated identifier"));
    }
    ids.add(c.identifier);
  }

  return Ok({ conditions: conditions.value, options });
}

function parseCondition(expr: any): Result<condition> {
  if (!expr.identifier || !expr.operation) {
    return Err(new CredError(ErrorName.InvalidQuery, "missing required properties"));
  }

  const c: condition = {
    identifier: expr.identifier,
    operation: expr.operation,
  };

  switch (expr.operation) {
    case "IN": {
      if (!expr.value) {
        return Err(new CredError(ErrorName.InvalidQuery, "missing range value for IN operation"));
      }
      if (typeof expr.value.from !== "string" || typeof expr.value.to !== "string") {
        return Err(new CredError(ErrorName.InvalidQuery, "missing range for IN operation"));
      }
      try {
        c.value = {
          from: BigInt(expr.value.from),
          to: BigInt(expr.value.to),
        } as Range;
      } catch {
        return Err(new CredError(ErrorName.InvalidQuery, "invalid range for IN operation"));
      }
      break;
    }
    case "IS": {
      if (!Array.isArray(expr.value)) {
        return Err(new CredError(ErrorName.InvalidQuery, "invalid set value for IS operation"));
      }
      expr.value.forEach((v: any) => {
        if (typeof v !== "string") {
          return Err(new CredError(ErrorName.InvalidQuery, "invalid set for IS operation"));
        }
        return v;
      });
      try {
        c.value = expr.value.map((v: string) => BigInt(v)) as Set;
      } catch {
        return Err(new CredError(ErrorName.InvalidQuery, "invalid set for IS operation"));
      }
      break;
    }
    case "REVEAL":
    case "HIDE":
      break;
    default:
      return Err(new CredError(ErrorName.InvalidQuery, "unsupported operation"));
  }

  return Ok(c);
}
