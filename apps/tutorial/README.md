# Tutorial for Galxe identity protocol

## tutorial1

This tutorial guides you through the fundamental process of issuing and verifying credentials on Ethereum. You will learn how to create and sign a credential, generate a zero-knowledge proof, and perform both on-chain and off-chain verifications.

### run

```bash
pnpm run tutorial1
```

## useNebraUpa

This tutorial guides you through the process of using Nebra UPA to aggregate and verify credentials on Sepolia. To run this tutorial, you need to have an funded address on Sepolia as Nebra signer. This address is used to submit proofs to the Nebra Upa receiver. Example proof submission transaction can be found [here](https://sepolia.etherscan.io/tx/0x9f8b405edbfd11bb758695b90a94408030d7aba94d44312824329bee62d49132).

### prerequisites

To run this tutorial, you will need to provide an EOA account that has some testnet ETH on Sepolia.
This account will be used to send a transaction, posting proof aggregation request on Sepolia.
Create `.env` file using `.env.example` as a template. Update `NEBRA_SIGNER_PK` with your private key.

### Note

1. Nebra is currently live only on Sepolia testnet.
2. This tutorial will run for a few minutes as it waits for the proof submission to be aggregated by Nebra and verified on-chain.

### run

```bash
pnpm run useNebraUpa
```
