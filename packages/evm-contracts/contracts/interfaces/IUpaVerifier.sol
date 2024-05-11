// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// Reference to a single proof in a Submission.  Used by clients to show that
/// a given proof appears in a submission which has been verified as part of
/// an aggregated proof.  Not required for single-proof submissions, since in
/// this case `submissionId == proofId`, and the `merkleProof` and `location`
/// are trivial.
struct ProofReference {
    bytes32 submissionId;
    bytes32[] merkleProof;
    /// Index into the proofs in the submission.  The sequence of proofs
    /// within the submission starts at this index.
    uint16 location;
}

/// @title IUpaVerifier interface
/// @notice Any UPA that supports this interface can be used by the AggregatedStatefulVerifier contract.
interface IUpaVerifier {
    // Checks if UPA has verified a proof that publicInputs is valid for
    // the circuit `circuitId`.
    function isVerified(uint256 circuitId, uint256[] calldata publicInputs) external view returns (bool);

    // Checks if UPA has verified a proof that publicInputs is valid for
    // the circuit `circuitId`, where the proof belongs to a multi-proof
    // submission.
    function isVerified(
        uint256 circuitId,
        uint256[] calldata publicInputs,
        ProofReference calldata proofReference
    ) external view returns (bool);
}
