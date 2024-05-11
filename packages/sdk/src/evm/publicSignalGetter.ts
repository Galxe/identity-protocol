import { BigNumberish } from "ethers";
import { IPublicSignalGetter, IPublicSignalGetter__factory } from "@galxe-identity-protocol/evm-contracts";
import { Base, Options } from "@/evm/base";

import { IntrinsicPublicSignal } from "@/credential/credential";

/**
 * PublicSignalGetter is an interface for retrieving public signals based on their names and the provided public signals array.
 */
export class PublicSignalGetter extends Base<IPublicSignalGetter> {
  constructor(address: string, options?: Options) {
    const { signerOrProvider } = options || {};
    const contract = IPublicSignalGetter__factory.connect(address, signerOrProvider);
    super(contract, signerOrProvider);
  }

  /**
   * Retrieves a public signal based on its name and the provided public signals.
   * @param name The name of the signal, represented as an enum converted to uint8.
   * @param publicSignals The array of public signals.
   * @returns A promise that resolves to a number representing the value of the requested public signal.
   */
  public async getPublicSignal(name: IntrinsicPublicSignal, publicSignals: BigNumberish[]): Promise<bigint> {
    return await this.contract.getPublicSignal(name, publicSignals);
  }
}
