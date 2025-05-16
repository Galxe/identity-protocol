# Galxe Identity Protocol

## What's inside?

This is the monorepo for Galxe Identity protocol, powered by Turborepo. It includes the following packages/apps:

### Packages

- `@galxe-identity-protocol/evm-contracts`: a hardhat project of all the evm contracts, including typechain generated TypeScript bindings.
- `@galxe-identity-protocol/sdk`: a TypeScript SDK for everything related to the protocol.
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

### Apps

- `cli`: a cli tool for managing the protocol, including interacting with the on-chain contracts and type generation.
- `issuer`: a microservice that issues credentials by GRPC request.
- `sstyper`: a fully self-sovereign credential type setup tool.

## Development setup

### Node version

Developers should use the current LTS version of node. Currently, node v20.11.1. For package users, the SDK is compatible with node v18 and above.

```bash
# For nvm users:
nvm install --lts
nvm use --lts
```

### Setup

We use corepack for managing package managers.

```bash
corepack enable
corepack install # this will install pnpm version specified in package.json
```

## Build, Test, and Lint

```
pnpm lint
pnpm build
pnpm test
```

## How to create a new credential type

1. Using type DSL to design the credential type.
2. Use `app/sstyper` to run the setup process, which will generate type artifacts, including 
  + zkey, vkey, proofgen wasm...
  + solidity verifier contract
3. Upload the artifacts to IPFS and create a metadata json file containing URI to the artifacts. See artifacts in `artifacts/**/metadata.json` for reference.
4. Deploy the verifier contract to supported chains. See `evm-contracts/deploy`.
5. Register the type on supported chains, using the `metadata.json` URI. If primitive type, see `evm-contracts/scripts` for reference.

### NOTICE

If you saw build error when building a package that is depending on local packages, try `pnpm build` in the root directory first. It is because that dependencies were not built.