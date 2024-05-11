import * as pb from "@/grpc/issuer/v1/issuer.js";
import { unmarshalHeader, unmarshalBody } from "@/issuer/marshal.js";
import { credential, utils, babyzk } from "@galxe-identity-protocol/sdk";
import { Logger } from "tslog";

const log = new Logger({ name: "protocol" });

export async function GenerateSignedCredential(
  req: pb.GenerateSignedCredentialRequest,
  issuerID: string,
  issuerPK: string
): Promise<pb.GenerateSignedCredentialResponse> {
  log.info("generate signed credential", req.header);

  const iid = BigInt(issuerID);
  const signingKey = utils.decodeFromHex(issuerPK);
  const publicKey = babyzk.toPubKey(signingKey);
  const signatureID = babyzk.toKeyID(publicKey);

  const chainID = BigInt(req.chainId);

  const expireAt = BigInt(req.expiredAt);
  const identityCommitment = BigInt(req.identityCommitment);

  const header = unmarshalHeader(req.header!);
  const body = unmarshalBody(req.body!);
  const attachments = req.attachments!.attachments;

  const cred = new credential.Credential(header, body);

  const sigMetadata = new credential.SignatureMetadata(
    credential.VerificationStackEnum.BabyZK,
    signatureID,
    expireAt,
    identityCommitment,
    iid,
    chainID,
    publicKey
  );
  cred.attachments = attachments;

  cred.sign(babyzk, signingKey, sigMetadata);

  return pb.GenerateSignedCredentialResponse.create({
    signedCred: cred.marshal(),
  });
}
