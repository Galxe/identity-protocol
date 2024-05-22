import "dotenv/config";
import { prepare, credential, evm, credType, errors, user, issuer, utils } from "@galxe-identity-protocol/sdk";
import { ethers } from "ethers";
import { UpaClient, CircuitIdProofAndInputs, Proof } from "@nebrazkp/upa/sdk";
import * as fs from "fs";

// conviniently unwrap the result of a function call by throwing an error if the result is an error.
const unwrap = errors.unwrap;

// Use Ankr's free open rpc in this example.
const RPC = "https://rpc.ankr.com/eth_sepolia";
const provider = new ethers.JsonRpcProvider(RPC);

const context = "Proof Aggregation Tutorial Example Context";

// registered with this tx:
// https://sepolia.etherscan.io/tx/0x89c0cf5af6f6c0b6750bd6b3a4b93c02605d0ba1541c26387ed7da3ae7df3ffa
const circuidId = BigInt("535783125321978663259414080602879573584328345995263811920911450103380255481");

// This is a dummy issuer's EVM address that has been registered on sepolia.
const dummyIssuerEvmAddr = "0xdeee54e0f3cbb7d5c4b2cb91d39c9c9b48a1b532";

// demonstration of the issuingProcess.
async function issuingProcess(userEvmAddr: string, userIdc: bigint) {
  const typeSpec = credType.primitiveTypes.unit;
  const tp = unwrap(credType.createTypeFromSpec(typeSpec));

  const contextID = credential.computeContextID(context);
  console.log("contextID: ", contextID);
  // Now, let's create the credential.
  const newCred = unwrap(
    credential.Credential.create(
      {
        type: tp,
        contextID: contextID,
        userID: BigInt(userEvmAddr),
      },
      {}
    )
  );
  newCred.attachments["creativity"] = "uncountable";

  // signing the credential.
  const issuerID = BigInt(dummyIssuerEvmAddr);
  const issuerChainID = BigInt(11155111); // sepolia
  // A mock private key for the signer, which is used to sign the credential.
  // This key has been registered and activated on sepolia by the dummy issuer.
  // pub key: 0x0435be315dd7c00c9ba151f7c811bde6598c2e1b1f30552a3fb07a34b6c91416a99883f708f3389842c8f43c1c272bb8210a68d25f09201887354d85e8e58beff0
  const dummyKey = utils.decodeFromHex("0x8d06429619a08325ea79a575e1df14787be5223614403a9142360616811f7aea");
  const issuerPk = dummyKey;
  // create a new issuer object using the private key, issuerID, and issuerChainID.
  const myIssuer = new issuer.BabyzkIssuer(issuerPk, issuerID, issuerChainID);
  // sign the credential to user's identity commitment, with a unique signature id and expiration date.
  myIssuer.sign(newCred, {
    sigID: BigInt(100),
    expiredAt: BigInt(Math.ceil(new Date().getTime() / 1000) + 7 * 24 * 60 * 60), // assuming the credential will be expired after 7 days
    identityCommitment: userIdc,
  });

  // all done, return the credential to the owner.
  return newCred;
}

// demonstration of the proofGenProcess.
async function proofGenProcess(myCred: credential.Credential, u: user.User) {
  const externalNullifier = utils.computeExternalNullifier("Galxe Identity Protocol tutorial's verification");
  console.log("downloading proof generation gadgets...");
  const proofGenGagets = await user.User.fetchProofGenGadgetsByTypeID(myCred.header.type, provider);
  console.log("proof generation gadgets are downloaded successfully.");
  // Let's generate the proof.
  // Assume that we want to verify that the credential is still valid after 3 days.
  const expiredAtLowerBound = BigInt(Math.ceil(new Date().getTime() / 1000) + 3 * 24 * 60 * 60);
  // Do not reveal the credential's actual id, which is the evm address in this example
  const equalCheckId = BigInt(0);
  // Instead, claim to be Mr.Deadbeef. It's verifier's responsibility to verify that the pseudonym is who
  // he claims to be, after verifying the proof.
  const pseudonym = BigInt("0xdeadbeef");
  // Here we ignore the conditions and just use the options in the query, since unit credential needs no conditions.
  const proof = await u.genBabyzkProofWithQuery(
    u.getIdentityCommitment("evm")!,
    myCred,
    proofGenGagets,
    `
    {
      "options": {
        "expiredAtLowerBound": "${expiredAtLowerBound}",
        "externalNullifier": "${externalNullifier}",
        "equalCheckId": "${equalCheckId}",
        "pseudonym": "${pseudonym}"
      }
    }
    `
  );
  return proof;
}

async function verifyByCallingAggregatedStatefulVerifier(publicSignals: string[]): Promise<boolean> {
  // As a verifier, we must decide the expected
  // contextID, issuerID, and typeID of the credential.
  const expectedContextID = credential.computeContextID(context);
  const expectedIssuerID = BigInt(dummyIssuerEvmAddr);
  const expectedTypeID = credType.primitiveTypes.unit.type_id;

  // Let's take a look at the on-chain verification first.
  // It is just 1 simple function call.
  const aggregatedStatefulVerifier = evm.v1.createAggregatedBabyzkStatefulVerifier({
    signerOrProvider: provider,
  });
  const statefulVerifierResult = await aggregatedStatefulVerifier.verifyProofFull(
    expectedTypeID,
    expectedContextID,
    expectedIssuerID,
    circuidId,
    publicSignals
  );
  if (statefulVerifierResult !== evm.VerifyResult.OK) {
    console.error("Proof verification failed, reason: ", evm.verifyResultToString(statefulVerifierResult));
  } else {
    console.log("On-chain stateful proof verification is successful.");
  }
  return true;
}

async function main() {
  // prepare must be called by the application before any other function.
  await prepare();

  // setup UPA
  const upaInstanceDescriptor = JSON.parse(fs.readFileSync("upa.instance", "ascii"));
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const signer = new ethers.Wallet(process.env.NEBRA_SIGNER_PK!, provider);
  const upaClient = new UpaClient(signer, upaInstanceDescriptor);

  // The very first step is to create a user with a random identity.
  // This should be done on user's device and the identity should be stored securely.
  const u = new user.User();
  const evmIdSlice = u.createNewIdentitySlice("evm");

  // User's identity commitment is computed based on the secrets of the identity slice.
  // You can also retrive the identity commitment from the identity slice.
  const userIdc = user.User.computeIdentityCommitment(evmIdSlice);

  // let's use a famous Ethereum address in this example.
  const userEvmAddr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

  // Issuer's process: issuing a credential to the user.
  const myCred = await issuingProcess(userEvmAddr, userIdc);
  console.log("Credential is issued successfully.");
  console.log(myCred.marshal(2));

  // User's process: generating a zk proof to prove some statements about the credential.
  const proof = await proofGenProcess(myCred, u);
  console.log("Proof is generated successfully.", proof);

  const circuitIdProofAndInputs: CircuitIdProofAndInputs[] = [
    {
      circuitId: circuidId,
      proof: Proof.from_snarkjs(proof.proof),
      inputs: proof.publicSignals.map(x => BigInt(x)),
    },
  ];
  const submissionHandle = await upaClient.submitProofs(circuitIdProofAndInputs);
  const submitProofTxReceipt = await upaClient.waitForSubmissionVerified(submissionHandle);
  console.log("Proof is submitted successfully.", submitProofTxReceipt);

  // Now that our proof submission has been verified, we can just verify the
  // proof using public signals only.
  await verifyByCallingAggregatedStatefulVerifier(proof.publicSignals);

  process.exit(0);
}

main();
