import { BabyzkDefaultPsGetter__factory } from "@galxe-identity-protocol/evm-contracts";
import { Signer } from "ethers";
import { beforeEach, describe, it, expect } from "vitest";
import { PublicSignalGetter } from "./publicSignalGetter";
import { etherProvider } from "../testutils";
import { IntrinsicPublicSignal } from "@/credential/credential";

describe("BabyzkDefaultPsGetter", () => {
  let sender: Signer;
  let psGetter: PublicSignalGetter;

  beforeEach(async () => {
    const { accounts } = await etherProvider();
    sender = accounts[0] as Signer;

    const factory = new BabyzkDefaultPsGetter__factory(sender);
    const PsGetter = await factory.deploy({ from: await sender.getAddress() });
    psGetter = new PublicSignalGetter(await PsGetter.getAddress(), { signerOrProvider: sender });
  });

  describe("get public signals", () => {
    it("successful", async () => {
      const publicSignals = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const names = [
        IntrinsicPublicSignal.Type,
        IntrinsicPublicSignal.Context,
        IntrinsicPublicSignal.Nullifier,
        IntrinsicPublicSignal.ExternalNullifier,
        IntrinsicPublicSignal.RevealIdentity,
        IntrinsicPublicSignal.ExpirationLb,
        IntrinsicPublicSignal.KeyId,
        IntrinsicPublicSignal.IdEqualsTo,
        IntrinsicPublicSignal.SigRevocationSmtRoot,
      ];

      for (let i = 0; i < names.length; i++) {
        const signal = await psGetter.getPublicSignal(names[i] as IntrinsicPublicSignal, publicSignals);
        expect(signal).equal(BigInt(publicSignals[i] as number));
      }
    });
  });
});
