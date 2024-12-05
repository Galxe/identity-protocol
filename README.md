# Galxe Identity Protocol x ZKVerify

This project was developed for the ZKVerify online hackathon. It's a fork of the Galxe Identity Protocol [repository](https://github.com/galxe-identity-protocol/tutorial). You can find the original README [here](README-ORIGINAL.md).

The files modified for the hackathon are:
- [`src/useZkVerify.ts`](apps/tutorial/src/useZkVerify.ts)
- [`package.json`](apps/tutorial/package.json)

The goal of this project is to demonstrate how to integrate Galxe Identity Protocol with ZKVerify to significantly reduce verification costs without sacrificing security.

## Galxe
Galxe is a decentralized super app and web3's largest onchain distribution platform, with over 22 million users and trusted by top partners like Optimism, Polygon, and many more.
Within its infrastructure, Galxe built Identity Protocol, a technology that utilizes privacy-preserving ZK technology to enable safe and seamless integration of digital identities across platforms.
Built on top of Identity Protocol, there is another product by Galxe, the Galxe Passport, chosen by over 1 million users to share their digital identity.

## ZKVerify
ZKVerify is a zero-knowledge proof platform that allows users to verify their identity without revealing any personal information.

## What we cooked
We created a new tutorial that follows the original one published by Galxe in this repo, but instead of doing an off-chain or on-chain verification, we use ZKVerify to verify the proof submitted. 

The process is divided in three steps:
1. Issuer issuing a credential to the user
2. User generating a proof to prove some statements about the credential
3. Submitting the proof to ZKVerify to verify it

We implemented the last step in two ways:
- Registering the verification key of the issuer onchain and then submitting the proof to ZKVerify
- Submitting the proof directly to ZKVerify with the verification key

We implementing the last step in two way:
- Registering the verification key of the issuer onchain and then submitting the proof to ZKVerify.
- Submitting the proof directly to ZKVerify with the verification key.

+++ add considerations about the size +++

## How to run it

Follow the original tutorial to run the code:
```bash
# Quick start
corepack enable
corepack install
pnpm build
```
This will install the dependencies and build the project.

Then go to the `apps/tutorial` folder and run:
```bash
npm install
```
Add `ZKVERIFY_SIGNER_PK` to the `.env` file with the private key of the account that will register the verification key onchain.

Finally, run the script:
```bash
npm run useZkVerify
```

## Considerations

















