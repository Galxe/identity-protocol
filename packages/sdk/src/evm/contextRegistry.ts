import { BigNumberish, Overrides } from "ethers";
import {
  ContextRegistry as ContextRegistryContract,
  ContextRegistry__factory,
} from "@galxe-identity-protocol/evm-contracts";
import { Base, Options, Transaction } from "@/evm/base";

import { computeContextID } from "@/credential/credential";

/**
 * ContextRegistry is a contract that stores the context schema.
 */
export class ContextRegistry extends Base<ContextRegistryContract> {
  constructor(address: string, options?: Options) {
    const { signerOrProvider } = options || {};
    const factory = new ContextRegistry__factory();
    const contract = factory.attach(address) as ContextRegistryContract;
    super(contract, signerOrProvider);
  }

  /**
   * registerContext registers a new context.
   * @param context the context string
   * @param overrides optional overrides
   * @returns promise of the transaction
   */
  public async registerContext(context: string, overrides?: Overrides): Promise<Transaction<bigint>> {
    const tx = await this.contract.registerContext(context, overrides ?? {});
    return new Transaction(tx, async () => computeContextID(context));
  }

  /**
   * getContext returns an existing context by its uid.
   * @param uid the uid of the context
   * @returns promise of the context
   */
  public async getContext(uid: BigNumberish): Promise<string> {
    return await this.contract.getContext(uid);
  }

  /**
   * calculateContextID calculates the contextID for a given context string
   * @param context the name of the context
   * @returns promise of the uid
   */
  public async calculateContextID(context: string): Promise<bigint> {
    return await this.contract.calculateContextID(context);
  }
}
