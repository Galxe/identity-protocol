// Enum for the verification results of proofs.
export enum VerifyResult {
  OK,
  TYPE_UNINITIALIZED,
  TYPE_ID_MISMATCH,
  CONTEXT_ID_MISMATCH,
  PUBKEY_INACTIVE,
  SIG_REVOCATION_SMT_ROOT_MISMATCH,
  PROOF_INVALID,
  EXPIRED,
  ALIASED_SIGNAL,
  UNKNOWN_ERROR,
}

export function verifyResultToString(result: VerifyResult): string {
  switch (result) {
    case VerifyResult.OK:
      return "OK";
    case VerifyResult.TYPE_UNINITIALIZED:
      return "TYPE_UNINITIALIZED";
    case VerifyResult.TYPE_ID_MISMATCH:
      return "TYPE_ID_MISMATCH";
    case VerifyResult.CONTEXT_ID_MISMATCH:
      return "CONTEXT_ID_MISMATCH";
    case VerifyResult.PUBKEY_INACTIVE:
      return "PUBKEY_INACTIVE";
    case VerifyResult.SIG_REVOCATION_SMT_ROOT_MISMATCH:
      return "SIG_REVOCATION_SMT_ROOT_MISMATCH";
    case VerifyResult.PROOF_INVALID:
      return "PROOF_INVALID";
    case VerifyResult.EXPIRED:
      return "EXPIRED";
    case VerifyResult.ALIASED_SIGNAL:
      return "ALIASED_SIGNAL";
    case VerifyResult.UNKNOWN_ERROR:
      return "UNKNOWN_ERROR";
    default:
      throw new Error(`Unknown VerifyResult: ${result}`);
  }
}
