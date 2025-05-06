# Galxe Identity Protocol x zkVerify

This project is developed for the [zkVerify online hackathon](https://zkverify-zk-application-and-infrastructure-buildin.devfolio.co/overview). It's a fork of the Galxe Identity Protocol [repository](https://github.com/galxe-identity-protocol/tutorial). You can find the original README [here](README-ORIGINAL.md).

The processed files for the hackathon are:

- [`src/useZkVerify.ts`](apps/tutorial/src/useZkVerify.ts)
- [`package.json`](apps/tutorial/package.json)
- [`start.sh`](start.sh)

The goal of this project is to demonstrate how to integrate zkVerify in Galxe Identity Protocol to significantly reduce verification costs without sacrificing security.

## zkVerify

[zkVerify](https://zkverify.io/) is a modular blockchain focused on proof verification. It's specifically enables blockchain networks to offload the computationally heavy and expensive process of zk (zero-knowledge) proof verification, drastically reducing cost. It's support multiple verification schemes, including Groth16, Fflonk, Risc0 and more.

## Galxe

Galxe is a decentralized super app and web3's largest onchain distribution platform, with over 31 million active users and trusted by top partners like Optimism, Polygon, and many more.
Within its infrastructure, Galxe built [Identity Protocol](https://www.galxe.com/identity), a technology that utilizes privacy-preserving ZK technology to enable safe and seamless integration of digital identities across platforms.
Built on top of Identity Protocol, there is another product by Galxe, the [Galxe Passport](https://www.galxe.com/passport), chosen by around 1 million users to share their digital identity.

## What we cooked

We created a new tutorial that follows the original one published by Galxe in this repo, but instead of doing an off-chain or an expensive on-chain verification, we integrated zkVerify technology as verification layer to efficiently verify the proofs.

> **Note:** Galxe has already integrated Nebra UPA in a tutorial, a protocol that aggregates multiple proofs for reducing the verification cost. This validates our idea of introducing zkVerify.

The process is divided in three steps:

1. Issuer issuing a credential to the user
2. User generating a proof to prove some statements about the credential
3. Submitting the proof to zkVerify to verify it

We implemented the last step in two ways:

- Registering the verification key of the issuer onchain and then submitting the proof to zkVerify, txHash: [0x11c2ddf64b5ddfcb1b1404d655ac41f23190f579f4bf2d79d612375df7a1fbf6](https://zkverify-explorer.zeeve.net/extrinsics/0x11c2ddf64b5ddfcb1b1404d655ac41f23190f579f4bf2d79d612375df7a1fbf6)
- Submitting the proof directly to zkVerify with the verification key, txHash: [0x7d7a24d8c0c47fcc03f24ec54fa4575f6806bc7f9ef202eff7172496a14c27a2](https://zkverify-explorer.zeeve.net/extrinsics/0x7d7a24d8c0c47fcc03f24ec54fa4575f6806bc7f9ef202eff7172496a14c27a2)

## How to run it

Follow the original tutorial to initialize the repository:

```bash
# Quick start
corepack enable
corepack install
pnpm build
```

This will install the dependencies and build the project.

Then go to the `apps/tutorial` folder and install the dependencies:

```bash
cd apps/tutorial
pnpm install
```

Add `ZKVERIFY_SIGNER_PK` to the `.env` file with the private key of the account that will register the verification key onchain.

Finally, run the script:

```bash
npm run useZkVerify
```
---
Alternatively you can run the script:
```
chmod +x start.sh
./start.sh
```

Before to run make sure you have node latest version:
```bash
# For nvm users:
nvm install --lts
nvm use --lts
```


## Considerations

Galxe currently serves over 31 million active users and manages more than 350k credentials, making it the perfect candidate for testing scalable verification solutions with zkVerify.

Assessed that zkVerify can reduce proof verification costs by >90% compared to native verification on Ethereum, at Galxe's scale, this translates to a significant costs dropping - a transformation that could generate millions in savings annually.

Beyond pure cost reduction, this integration opens new possibilities for Web3 identity management. With around 1 million users actively using Galxe Passport, cheaper verification enables more frequent credential checks, enhanced privacy features, and broader accessibility to trustless credential systems for smaller projects.

On a closing thought, we want to remark how specialized verification layers can solve real problems in large-scale identity systems, with the zkVerify-Galxe integration setting a new standard for efficient, accessible credential verification in Web3.
