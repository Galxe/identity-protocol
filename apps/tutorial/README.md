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
# useZkVerify

## Overview
A demonstration project for integrating zkVerify with Galxe Identity Protocol. This integration aims to significantly reduce verification costs while maintaining security.

### Prerequisites
- Node.js (Latest LTS version)
- pnpm
- Account with testnet ETH

## Workflow Overview
The verification process consists of three main steps:

1. **Credential Issuance**
   - Issuer creates and issues credentials to the user
   - Credentials contain verifiable claims about the user

2. **Proof Generation**
   - User generates zero-knowledge proofs
   - Proofs demonstrate specific statements about their credentials
   - Preserves privacy while proving credential validity

3. **Verification via zkVerify**
   - Proofs are submitted to zkVerify for verification
   - Can be done through direct verification or registered key method
   - Ensures efficient and cost-effective verification

### Verification Methods
1. **Registered Key Verification**
   - Transaction Hash: [0x11c2ddf64b5ddfcb1b1404d655ac41f23190f579f4bf2d79d612375df7a1fbf6](https://zkverify-explorer.zeeve.net/extrinsics/0x11c2ddf64b5ddfcb1b1404d655ac41f23190f579f4bf2d79d612375df7a1fbf6)

2. **Direct Verification**
   - Transaction Hash: [0x7d7a24d8c0c47fcc03f24ec54fa4575f6806bc7f9ef202eff7172496a14c27a2](https://zkverify-explorer.zeeve.net/extrinsics/0x7d7a24d8c0c47fcc03f24ec54fa4575f6806bc7f9ef202eff7172496a14c27a2)


### Configuration
Add to `.env`:
```
ZKVERIFY_SIGNER_PK=your_private_key_here
```
### run

```bash
pnpm run useZkVerify
```

## Note

### Cost Reduction
- >90% reduction in proof verification costs compared to native Ethereum verification
- Significant savings at Galxe's scale (31M+ active users)

### Scalability
- Supports Galxe's 350k+ credentials
- Enables more frequent credential checks
- Enhanced privacy features
- Improved accessibility for smaller projects

### Technical Advantages
- Supports multiple verification schemes (Groth16, Fflonk, Risc0)
- Modular blockchain focused on proof verification
- Efficient on-chain verification process

## Additional Resources
- [zkVerify Documentation](https://zkverify.io/)