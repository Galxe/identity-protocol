import {
  BabyzkStatefulVerifier__factory,
  BabyzkDefaultPsGetter__factory,
  BabyZKGroth16Verifier__factory,
  BabyZKGroth16RevocableVerifier__factory,
  ContextRegistry__factory,
  IssuerRegistry__factory,
  TypeRegistry__factory,
} from "@galxe-identity-protocol/evm-contracts";
import { BabyzkStatefulVerifier } from "./statefulProofVerifier";
import { VerifyResult } from "./enum";
import { TypeRegistry } from "../typeRegistry";
import { IssuerRegistry } from "../issuerRegistry";
import { ContextRegistry } from "../contextRegistry";
import { PublicSignalGetter } from "../publicSignalGetter";
import { ProofVerifier } from "../proofVerifier";
import { Signer } from "ethers";

import { describe, expect, it, beforeEach } from "vitest";
import { etherProvider } from "../../testutils";

const unrevocableProofs = {
  proofs: [
    "17287865311066985283733208542516157961701724530658897303094041758582666454951",
    "16405217597499890447358208038784999082513976172901293744992488924552119467272",
    "17511724199377222514490750746829007629419810902896498259755015850482012584259",
    "5869714225445181399954162051213302620533047632865444788009058022334438344266",
    "1959355861754469298520794265257933597158410331539646277590065438413068926603",
    "19096918162369271605029848542376504228494702827220185035973104444317503726627",
    "216728479657378818913675440640775678141064487658099071457103103208212781875",
    "19402394114196496340294975308511152383663754622436148789178605935857963282953",
  ],
  publicSignals: [
    "778",
    "666",
    "849760699622323138423214777646360676343533388377892699649686780211564373610",
    "499624985322695799482841591270479138186369447061",
    "0",
    "4079407824",
    "1743582416365651167392966598529843347617363862106697818328310770809664607117",
    "19",
    "0",
    "50",
    "0",
    "101",
    "199",
    "201",
    "6",
    "8",
    "0",
  ],
};

const revocableProofs = {
  proofs: [
    "11257167836791023033685626118251722795590086285861503011138783367418388774817",
    "20896536297399464379561834869019610649840627342166291895910626779271251366437",
    "16990391134421136165810966166456369959274405114292967764114734352894094711024",
    "16595182854684234847099456831264849898355256359984025768577697973168597854235",
    "3829988524325219120970975891226103905518493048031001585475061597268934763845",
    "5271886994701011122763779536702041955318726357955841646783674030824164244943",
    "16737669457239861109117754448841627495369232887321049467500167011765859094656",
    "5842809538993923510294667222397398783167692776967111075719245483847740309306",
  ],
  publicSignals: [
    "778",
    "666",
    "849760699622323138423214777646360676343533388377892699649686780211564373610",
    "499624985322695799482841591270479138186369447061",
    "0",
    "4079407824",
    "1743582416365651167392966598529843347617363862106697818328310770809664607117",
    "19",
    "1243904711429961858774220647610724273798918457991486031567244100767259239747",
    "0",
    "50",
    "0",
    "101",
    "199",
    "201",
    "6",
    "8",
    "0",
  ],
};
describe("BabyzkStatefulVerifier", () => {
  let typeRegistry: TypeRegistry;
  let issuerRegistry: IssuerRegistry;
  let contextRegistry: ContextRegistry;
  let verifier: BabyzkStatefulVerifier;
  let publicSignalGetter: PublicSignalGetter;
  let proofVerifier: ProofVerifier;
  let revocableProofVerifier: ProofVerifier;
  let sender: Signer;
  let admin: Signer;

  beforeEach(async () => {
    const { accounts } = await etherProvider();
    sender = accounts[0] as Signer;
    admin = accounts[1] as Signer;
    // setup type registry
    const typeRegistryFactory = new TypeRegistry__factory(sender);
    const typeReg = await typeRegistryFactory.deploy(sender.getAddress());
    typeRegistry = new TypeRegistry(await typeReg.getAddress(), { signerOrProvider: sender });

    // setup issuer registry
    const issuerRegistryFactory = new IssuerRegistry__factory(sender);
    const issuerReg = await issuerRegistryFactory.deploy();
    issuerRegistry = new IssuerRegistry(await issuerReg.getAddress(), { signerOrProvider: sender });

    // setup context registry
    const contextRegistryFactory = new ContextRegistry__factory(sender);
    const ctxReg = await contextRegistryFactory.deploy();
    contextRegistry = new ContextRegistry(await ctxReg.getAddress(), { signerOrProvider: sender });

    // setup babyzk default ps getter
    const babyzkPublicSignalGetterFactory = new BabyzkDefaultPsGetter__factory(sender);
    const babyzkPublicSignalGetter = await babyzkPublicSignalGetterFactory.deploy();
    publicSignalGetter = new PublicSignalGetter(await babyzkPublicSignalGetter.getAddress(), {
      signerOrProvider: sender,
    });

    // setup babyzk proof verifiers
    const babyzkVerifierFactory = new BabyZKGroth16Verifier__factory(sender);
    const babyzkVerifier = await babyzkVerifierFactory.deploy({ from: await sender.getAddress() });
    proofVerifier = new ProofVerifier(await babyzkVerifier.getAddress(), { signerOrProvider: sender });

    // setup babyzk revocable proof verifier
    const babyzkRevocableVerifierFactory = new BabyZKGroth16RevocableVerifier__factory(sender);
    const babyzkRevocableVerifier = await babyzkRevocableVerifierFactory.deploy({ from: await sender.getAddress() });
    revocableProofVerifier = new ProofVerifier(await babyzkRevocableVerifier.getAddress(), {
      signerOrProvider: sender,
    });

    // setup verifier
    const factory = new BabyzkStatefulVerifier__factory(sender);
    const verifierReg = await factory.deploy(
      typeRegistry.contract.getAddress(),
      issuerRegistry.contract.getAddress(),
      admin.getAddress()
    );
    verifier = new BabyzkStatefulVerifier(await verifierReg.getAddress(), { signerOrProvider: sender });
  });

  describe("verify proof static", () => {
    it("uninitialized type", async () => {
      const result = await verifier.verifyProofStatic(1n, 1n, 1n, [], []);
      expect(result).toEqual(VerifyResult.TYPE_UNINITIALIZED);
    });
    it("type id mismatch", async () => {
      // register type
      const tx = await typeRegistry.registerType1Step(
        true,
        "name",
        "definition",
        "description",
        "uri",
        1n,
        verifier.contract.getAddress(),
        publicSignalGetter.contract.getAddress()
      );
      const typeID = await tx.wait();
      const incorrectTypeID = 1n;
      const contextID = 1n;
      const nullifier = 1n;
      const externalNullifier = 1n;
      const revealIdentity = 1n;
      const expirationLb = 1n;
      const keyID = 1n;
      const idEqualsTo = 1n;
      const sigRevocationSMTRoot = "0x0000000000000000000000000000000000000000000000000000000000000001";
      const result = await verifier.verifyProofStatic(
        typeID,
        0,
        0,
        [1],
        [
          incorrectTypeID,
          contextID,
          nullifier,
          externalNullifier,
          revealIdentity,
          expirationLb,
          keyID,
          idEqualsTo,
          sigRevocationSMTRoot,
        ]
      );
      expect(result).toEqual(VerifyResult.TYPE_ID_MISMATCH);
    });
    it("context id mismatch", async () => {
      // register type
      const tx = await typeRegistry.registerType1Step(
        true,
        "name",
        "definition",
        "description",
        "uri",
        1n,
        verifier.contract.getAddress(),
        publicSignalGetter.contract.getAddress()
      );
      const typeID = await tx.wait();
      // register context
      const tx2 = await contextRegistry.registerContext("context");
      const contextID = await tx2.wait();
      const incorrectContextID = 1n;
      const nullifier = 1n;
      const externalNullifier = 1n;
      const revealIdentity = 1n;
      const expirationLb = 1n;
      const keyID = 1n;
      const idEqualsTo = 1n;
      const sigRevocationSMTRoot = "0x0000000000000000000000000000000000000000000000000000000000000001";
      const result = await verifier.verifyProofStatic(
        typeID,
        contextID,
        0,
        [1, 2],
        [
          typeID,
          incorrectContextID,
          nullifier,
          externalNullifier,
          revealIdentity,
          expirationLb,
          keyID,
          idEqualsTo,
          sigRevocationSMTRoot,
        ]
      );
      expect(result).toEqual(VerifyResult.CONTEXT_ID_MISMATCH);
    });
    it("pub key inactive", async () => {
      // register type
      const tx = await typeRegistry.registerType1Step(
        true,
        "name",
        "definition",
        "description",
        "uri",
        1n,
        verifier.contract.getAddress(),
        publicSignalGetter.contract.getAddress()
      );
      const typeID = await tx.wait();
      // register context
      const tx2 = await contextRegistry.registerContext("context");
      const contextID = await tx2.wait();
      const nullifier = 1n;
      const externalNullifier = 1n;
      const revealIdentity = 1n;
      const expirationLb = 1n;
      const keyID = 1n;
      const idEqualsTo = 1n;
      const sigRevocationSMTRoot = "0x0000000000000000000000000000000000000000000000000000000000000001";
      const incorrectKeyID = 2n;
      const result = await verifier.verifyProofStatic(
        typeID,
        contextID,
        keyID,
        [1, 2],
        [
          typeID,
          contextID,
          nullifier,
          externalNullifier,
          revealIdentity,
          expirationLb,
          incorrectKeyID,
          idEqualsTo,
          sigRevocationSMTRoot,
        ]
      );
      expect(result).toEqual(VerifyResult.PUBKEY_INACTIVE);
    });
    it("expired", async () => {
      // register type
      const tx = await typeRegistry.registerType1Step(
        true,
        "name",
        "definition",
        "description",
        "uri",
        1n,
        verifier.contract.getAddress(),
        publicSignalGetter.contract.getAddress()
      );
      const typeID = await tx.wait();
      // register context
      const tx2 = await contextRegistry.registerContext("context");
      const contextID = await tx2.wait();
      const nullifier = 1n;
      const externalNullifier = 1n;
      const revealIdentity = 1n;
      const expirationLb = 1n;
      const keyID = 1n;
      const idEqualsTo = 1n;
      const sigRevocationSMTRoot = "0x0000000000000000000000000000000000000000000000000000000000000001";
      const result = await verifier.verifyProofStatic(
        typeID,
        contextID,
        keyID,
        [1, 2],
        [
          typeID,
          contextID,
          nullifier,
          externalNullifier,
          revealIdentity,
          expirationLb,
          keyID,
          idEqualsTo,
          sigRevocationSMTRoot,
        ]
      );
      expect(result).toEqual(VerifyResult.EXPIRED);
    });

    it("unrevocable verify success", async () => {
      const typeID = 778n;
      const contextID = 666n;
      const keyID = 1743582416365651167392966598529843347617363862106697818328310770809664607117n;
      // register type
      await typeRegistry.setPrimitiveType(typeID, "name", "definition", "description", "uri", {
        revocable: false,
        verificationStackId: 1n,
        verifier: proofVerifier.contract.getAddress(),
        publicSignalGetter: publicSignalGetter.contract.getAddress(),
      });
      expect(
        await verifier.verifyProofStatic(
          typeID,
          contextID,
          keyID,
          unrevocableProofs.proofs,
          unrevocableProofs.publicSignals
        )
      ).toEqual(VerifyResult.OK);
    });

    it("revocable verify success", async () => {
      const typeID = 778n;
      const contextID = 666n;
      const keyID = 1743582416365651167392966598529843347617363862106697818328310770809664607117n;
      // register type
      await typeRegistry.setPrimitiveType(typeID, "name", "definition", "description", "uri", {
        revocable: true,
        verificationStackId: 1n,
        verifier: revocableProofVerifier.contract.getAddress(),
        publicSignalGetter: publicSignalGetter.contract.getAddress(),
      });
      expect(
        await verifier.verifyProofStatic(
          typeID,
          contextID,
          keyID,
          revocableProofs.proofs,
          revocableProofs.publicSignals
        )
      ).toEqual(VerifyResult.OK);
    });
  });

  describe("verify proof full", () => {
    it("sig revocation SMT root mismatch", async () => {
      const typeID = 778n;
      const contextID = 666n;
      const keyID = 1743582416365651167392966598529843347617363862106697818328310770809664607117n;
      // register type
      await typeRegistry.setPrimitiveType(typeID, "name", "definition", "description", "uri", {
        revocable: true,
        verificationStackId: 1n,
        verifier: revocableProofVerifier.contract.getAddress(),
        publicSignalGetter: publicSignalGetter.contract.getAddress(),
      });

      // register issuer
      const tx = await issuerRegistry.registerIssuer("issuer", 1n, keyID, "0x1234");
      const issuerId = await tx.wait();
      // update signature state
      await issuerRegistry.setSignatureState(
        typeID,
        contextID,
        issuerId,
        ":",
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );

      expect(
        await verifier.verifyProofFull(
          typeID,
          contextID,
          issuerId,
          revocableProofs.proofs,
          revocableProofs.publicSignals
        )
      ).toEqual(VerifyResult.SIG_REVOCATION_SMT_ROOT_MISMATCH);
    });
    it("unrevocable verify success", async () => {
      const typeID = 778n;
      const contextID = 666n;
      const keyID = 1743582416365651167392966598529843347617363862106697818328310770809664607117n;
      // register type
      await typeRegistry.setPrimitiveType(typeID, "name", "definition", "description", "uri", {
        revocable: false,
        verificationStackId: 1n,
        verifier: proofVerifier.contract.getAddress(),
        publicSignalGetter: publicSignalGetter.contract.getAddress(),
      });

      // register issuer
      const tx = await issuerRegistry.registerIssuer("issuer", 1n, keyID, "0x1234");
      const issuerId = await tx.wait();
      // update signature state
      // await issuerRegistry.setSignatureState(typeID, contextID, issuerId, ":", "0x02c0066e10a72abd2b33c3b214cb3e81bcb1b6e30961cd23c202b18673bf2543");

      expect(
        await verifier.verifyProofFull(
          typeID,
          contextID,
          issuerId,
          unrevocableProofs.proofs,
          unrevocableProofs.publicSignals
        )
      ).toEqual(VerifyResult.OK);
    });

    it("revocable verify success", async () => {
      const typeID = 778n;
      const contextID = 666n;
      const keyID = 1743582416365651167392966598529843347617363862106697818328310770809664607117n;
      // register type
      await typeRegistry.setPrimitiveType(typeID, "name", "definition", "description", "uri", {
        revocable: true,
        verificationStackId: 1n,
        verifier: revocableProofVerifier.contract.getAddress(),
        publicSignalGetter: publicSignalGetter.contract.getAddress(),
      });

      // register issuer
      const tx = await issuerRegistry.registerIssuer("issuer", 1n, keyID, "0x1234");
      const issuerId = await tx.wait();
      // update signature state
      await issuerRegistry.setSignatureState(
        typeID,
        contextID,
        issuerId,
        ":",
        "0x02c0066e10a72abd2b33c3b214cb3e81bcb1b6e30961cd23c202b18673bf2543"
      );

      expect(
        await verifier.verifyProofFull(
          typeID,
          contextID,
          issuerId,
          revocableProofs.proofs,
          revocableProofs.publicSignals
        )
      ).toEqual(VerifyResult.OK);
    });
  });
});
