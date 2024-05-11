/* eslint-disable  @typescript-eslint/no-explicit-any */

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const Err = <E extends Error>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

export const encase =
  <T, A extends any[]>(fn: (...args: A) => T) =>
  (...args: A): Result<T> => {
    try {
      return { ok: true, value: fn(...args) };
    } catch (e) {
      return { ok: false, error: e as Error };
    }
  };

export const encased = <T, A extends any[]>(fn: (...args: A) => T, ...args: A) => encase(fn)(...args);

export const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
};

export enum ErrorName {
  InvalidTypeName = "InvalidTypeName",
  InvalidTypeParameter = "InvalidTypeParameter",
  InvalidTypeDef = "InvalidTypeDef",
  InvalidPragma = "InvalidPragma",
  InvalidClaimName = "InvalidClaimName",
  InvalidClaimValue = "InvalidClaimValue",
  DuplicateClaimName = "DuplicateClaimName",
  InvalidCredential = "InvalidCredential",
  InvalidStatement = "InvalidStatement",
  InvalidStatementCheck = "InvalidStatementCheck",

  InvalidParameter = "InvalidTypeParameter",
  InvalidSignature = "InvalidSignature",

  UnsupportableType = "UnsupportedType",

  CompileFailed = "CompileFailed",

  InternalError = "InternalError",

  InvalidSignatureID = "InvalidSignatureID",
  SignatureRevoked = "SignatureRevoked",

  InvalidParameters = "InvalidParameters",

  Unimplemented = "Unimplemented",
}

export class CredError extends Error {
  name: ErrorName;
  message: string;
  constructor(name: ErrorName, message: string, cause?: any) {
    super(message);
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

export class CompileError extends Error {
  name: ErrorName;
  message: string;
  constructor(name: ErrorName, message: string, cause?: any) {
    super(message);
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}
