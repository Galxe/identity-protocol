import { BaseContract, Provider, Signer, TransactionReceipt, TransactionResponse } from "ethers";

export type SignerOrProvider = Signer | Provider;

export interface Options {
  signerOrProvider?: SignerOrProvider;
}

export class Transaction<T> {
  public readonly tx: TransactionResponse;
  private readonly waitCallback: (receipt: TransactionReceipt) => Promise<T>;

  constructor(tx: TransactionResponse, waitCallback: (receipt: TransactionReceipt) => Promise<T>) {
    this.tx = tx;
    this.waitCallback = waitCallback;
  }

  public async wait(confirmations?: number): Promise<T> {
    const receipt = await this.tx.wait(confirmations);
    if (!receipt) {
      throw new Error(`Unable to confirm: ${this.tx}`);
    }
    return this.waitCallback(receipt) as Promise<T>;
  }
}

export class Base<C extends BaseContract> {
  public contract: C;
  public signerOrProvider?: SignerOrProvider;

  constructor(contract: C, signerOrProvider?: SignerOrProvider) {
    this.signerOrProvider = signerOrProvider;
    this.contract = contract;
    if (signerOrProvider) {
      this.connect(signerOrProvider);
    }
  }

  // Connects the API to a specific signer. NOTE: This is a mutable operation.
  public connect(signerOrProvider: SignerOrProvider) {
    this.signerOrProvider = signerOrProvider;
    this.contract = this.contract.connect(signerOrProvider) as C;
    return this;
  }
}
