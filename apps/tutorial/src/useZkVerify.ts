import {
  prepare,
  credential,
  evm,
  credType,
  errors,
  user,
  issuer,
  utils,
  babyzkTypes,
} from "@galxe-identity-protocol/sdk";
import { ethers } from "ethers";
import {
  CurveType,
  Library,
  VerifyTransactionInfo,
  VKRegistrationTransactionInfo,
  ZkVerifyEvents,
  zkVerifySession,
} from "zkverifyjs";

// conviniently unwrap the result of a function call by throwing an error if the result is an error.
const unwrap = errors.unwrap;

// Use 1rpc's free open rpc in this example.
//const MAINNET_RPC = "https://rpc.ankr.com/eth/<API_KEY>";
//const MAINNET_RPC = "https://eth.llamarpc.com";
const MAINNET_RPC = "https://1rpc.io/eth";

const provider = new ethers.JsonRpcProvider(MAINNET_RPC);

// This is a dummy issuer's EVM address that has been registered on mainnet.
// Because it authroize the private key that is public to everyone,
// it should not be used in production!
const dummyIssuerEvmAddr = "0x15f4a32c40152a0f48E61B7aed455702D1Ea725e";

// demonstration of the issuingProcess.
async function issuingProcess(userEvmAddr: string, userIdc: bigint) {
  // 1. First of all, we must create the type of the credential.
  // In this example, Let's use the primitive type Scalar.
  const typeSpec = credType.primitiveTypes.scalar;
  const tp = unwrap(credType.createTypeFromSpec(typeSpec));

  // 2. Creating a credential based on the type.
  // In general, this is when the issuer decides "claims" about the user.
  // Because we are issuing a credential that represents the number of transactions,
  // let's fetch it from the Ethereum network.
  const txCount = await provider.getTransactionCount(userEvmAddr);
  // The contextID is a unique identifier representing the context of the credential.
  // We will just use the string "Number of transactions".
  // NOTE: The contextID must be registered on the chain before issuing the credential for visibility.
  const contextID = credential.computeContextID("Number of transactions");
  // Now, let's create the credential.
  const newCred = unwrap(
    credential.Credential.create(
      {
        type: tp,
        contextID: contextID,
        userID: BigInt(userEvmAddr),
      },
      {
        val: BigInt(txCount).toString(), // credential value, number of transactions
      }
    )
  );
  // Add additional attributes to the credential attachments, if needed
  // these attributes will not be part of the zero-knowledge proof, but
  // they will be signed by the issuer as well.
  // So, you must add them before signing the credential.
  newCred.attachments["creativity"] = "uncountable";

  // 3. Signing the credential.
  // After the credential is created, it must be signed by the issuer.
  // The issuer must have been registered on the chain, at least on the chain of the supplied ChainID.
  // Registering the issuer on more chains is recommended for better interoperability.
  // Also, the signing key's keyID must be active correspondingly on chains.
  // For demonstration purposes, we use the dummy issuer with a publicly known key.
  // The dummy issuer has been registered on etheruem mainnet, and the following key is also activated.
  // Don't use this issuer or key in production!
  const issuerID = BigInt(dummyIssuerEvmAddr);
  const issuerChainID = BigInt(1); // mainnet
  // A mock private key for the signer, which is used to sign the credential.
  // This key has been registered and activated on mainnet by the dummy issuer.
  const dummyKey = utils.decodeFromHex("0xfd60ceb442aca7f74d2e56c1f0e93507798e8a6e02c4cd1a5585a36167fa7b03");
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
  // Now issuer can issue a credential to the user.
  // In this example, we will issue a credential that represents the number of transactions,
  // that the user has made on the Ethereum, at the time of issuance.
  // Assuming that the user has received the credential,
  // user can generate a zk proof to prove that he has sent more than 500 transactions, but no more than 5000.
  // Let's first decide the external nullifier for the proof.
  const externalNullifier = utils.computeExternalNullifier("Galxe Identity Protocol tutorial's verification");
  // Now we need to fetch the proof generation gadgets. It is explicitly fetched outside the proof generation function
  // because usually, the proof generation gadgets are stored in a remote server, and may be large (3-10MB).
  // It's highly recommended to cache the proof generation gadgets locally.
  console.log("downloading proof generation gadgets...");
  const proofGenGagets = await user.User.fetchProofGenGadgetsByTypeID(myCred.header.type, provider);
  console.log("proof generation gadgets are downloaded successfully.");
  // Finally, let's generate the proof.
  // Assume that we want to verify that the credential is still valid after 3 days.
  const expiredAtLowerBound = BigInt(Math.ceil(new Date().getTime() / 1000) + 3 * 24 * 60 * 60);
  // Do not reveal the credential's actual id, which is the evm address in this example
  const equalCheckId = BigInt(0);
  // Instead, claim to be Mr.Deadbeef. It's verifier's responsibility to verify that the pseudonym is who
  // he claims to be, after verifying the proof.
  const pseudonym = BigInt("0xdeadbeef");
  // We want to prove that the credential's 'val' value is between 500 and 5000, inclusively.
  const proof = await u.genBabyzkProofWithQuery(
    u.getIdentityCommitment("evm")!,
    myCred,
    proofGenGagets,
    `
      {
        "conditions": [
          {
            "identifier": "val",
            "operation": "IN",
            "value": {
              "from": "500",
              "to": "5000"
            }
          }
        ],
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

async function executeVerificationWithZkVerify(proof: babyzkTypes.WholeProof, vk: unknown) {
  try {
    // Start a new zkVerifySession on our testnet
    const session = await zkVerifySession.start().Volta().withAccount(process.env.ZKVERIFY_SIGNER_PK!);

    // Execute the verification transaction
    const { events, transactionResult } = await session
      .verify()
      .groth16({ library: Library.snarkjs, curve: CurveType.bn254 })
      .execute({
        proofData: {
          vk: vk,
          proof: proof.proof,
          publicSignals: proof.publicSignals,
        },
      });

    // Listen for the 'includedInBlock' event
    events.on(ZkVerifyEvents.IncludedInBlock, eventData => {
      console.log("Transaction included in block:", eventData);
    });

    // Listen for the 'finalized' event
    events.on(ZkVerifyEvents.Finalized, eventData => {
      console.log("Transaction finalized:", eventData);
    });

    // Handle errors during the transaction process
    events.on("error", error => {
      console.error("An error occurred during the transaction:", error);
      throw error;
    });

    // Await the final transaction result
    const transactionInfo: VerifyTransactionInfo = await transactionResult;
    console.log("Transaction completed successfully:", transactionInfo);
    return transactionInfo;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}

async function executeVerificationWithZkVerifyRegisteredZK(
  proof: babyzkTypes.WholeProof,
  vkTransactionInfo: VKRegistrationTransactionInfo
) {
  try {
    // Start a new zkVerifySession on our testnet
    const session = await zkVerifySession.start().Volta().withAccount(process.env.ZKVERIFY_SIGNER_PK!);

    // Execute the verification transaction
    const { events, transactionResult } = await session
      .verify()
      .groth16({ library: Library.snarkjs, curve: CurveType.bn254 })
      .withRegisteredVk()
      .execute({
        proofData: {
          vk: vkTransactionInfo.statementHash!,
          proof: proof.proof,
          publicSignals: proof.publicSignals,
        },
      });

    // Listen for the 'includedInBlock' event
    events.on(ZkVerifyEvents.IncludedInBlock, eventData => {
      console.log("Transaction included in block:", eventData);
    });

    // Listen for the 'finalized' event
    events.on(ZkVerifyEvents.Finalized, eventData => {
      console.log("Transaction finalized:", eventData);
    });

    // Handle errors during the transaction process
    events.on("error", error => {
      console.error("An error occurred during the transaction:", error);
      throw error;
    });

    // Await the final transaction result
    const transactionInfo: VerifyTransactionInfo = await transactionResult;
    console.log("Transaction completed successfully:", transactionInfo);
    return transactionInfo;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}

export async function registerVerficationKey(vkJson: any): Promise<VKRegistrationTransactionInfo> {
  try {
    const session = await zkVerifySession.start().Volta().withAccount(process.env.ZKVERIFY_SIGNER_PK!);
    const { transactionResult } = await session
      .registerVerificationKey()
      .groth16({ library: Library.snarkjs, curve: CurveType.bn254 })
      .execute(vkJson);
    const { statementHash } = await transactionResult;
    console.log(statementHash);
    return transactionResult;
  } catch (error) {
    console.error("Error in registerVerficationKey:", error);
    throw error;
  }
}

async function verifyWithZkVerify(proof: babyzkTypes.WholeProof): Promise<boolean> {
  const expectedTypeID = credType.primitiveTypes.scalar.type_id;

  // When using zkVerify on-chain verification, you must first get the verification key.
  // You can embed the verification key in your application, or fetch it from a remote server.
  // We will fetch the verification key from the chain in this example.
  // The first step is to do a proof verification, making sure that the zk proof is valid.
  const tpRegistry = evm.v1.createTypeRegistry({
    signerOrProvider: provider,
  });
  const verifier = await tpRegistry.getVerifier(expectedTypeID, credential.VerificationStackEnum.BabyZK);
  const vKey = await verifier.getVerificationKeysRaw();
  console.log("on zkVerify-chain proof verification start, executing verification transaction");
  const verifyResult = await executeVerificationWithZkVerify(proof, vKey);
  console.log("on zkVerify-chain proof verification result: ", verifyResult);

  return true;
}

async function verifyWithZkVerifyRegisteredZK(proof: babyzkTypes.WholeProof): Promise<boolean> {
  const expectedTypeID = credType.primitiveTypes.scalar.type_id;

  // When using zkVerify on-chain verification, you must first get the verification key.
  // You can embed the verification key in your application, or fetch it from a remote server.
  // We will fetch the verification key from the chain in this example.
  // The first step is to do a proof verification, making sure that the zk proof is valid.
  const tpRegistry = evm.v1.createTypeRegistry({
    signerOrProvider: provider,
  });
  const verifier = await tpRegistry.getVerifier(expectedTypeID, credential.VerificationStackEnum.BabyZK);
  const vKey = await verifier.getVerificationKeysRaw();
  // on-chain proof verification
  console.log("on zkVerify-chain zk proof, registering verification key");
  const transactionHash = await registerVerficationKey(vKey);
  console.log("on zkVerify-chain proof verification start, executing verification transaction");
  const verifyResult = await executeVerificationWithZkVerifyRegisteredZK(proof, transactionHash);
  console.log("on zkVerify-chain proof verification result: ", verifyResult);

  return true;
}

async function main() {
  // prepare must be called by the application before any other function.
  await prepare();

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

  // On zkVeirfy chain verification process: verifying the proof.
  console.log("Starting verification with zkVerify");
  await verifyWithZkVerify(proof);
  console.log("End of verification with zkVerify");

  //console.log("Starting verification with zkVerify and registered verification key");
  //await verifyWithZkVerifyRegisteredZK(proof);
  //console.log("End of verification with zkVerify and registered verification key");

  process.exit(0);
}

main();
