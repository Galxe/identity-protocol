# Galxe Protocol SDK

## About

This is Galxe protocol's typescript SDK, compatible with both node and browser.

The package is built with both esm and cjs modules. A browser version (fully-bundled, very large) is also available under `dist/browser`.

For more information, please refer to the [docs](https://docs.galxe.com/identity/introduction).

## For developers

### Node Version

Developers should use the current LTS version of node. Currently, node v20.11.1.

```bash
# For nvm users:
nvm install --lts
nvm use --lts
```

### Setup

Install dependencies:

```bash
corepack enable
corepack install
```

## Coding conventions

### uint256 encoding

When encoding uint256 into two uint128(s), the order must be [msb, lsb].
This should apply to both claim values, circom generation for claim values and
statements.

### Zero value is the null value

Zero value is consider to be the null value in the following cases:

1. For property type, value 0 is considered to represent null. Issuers should not issue
   credential with any property-typed claims being 0.
2. For Signature ID, 0 is also an invalid value. For revocable credential with signature
   ID 0, they are considered to be non-revocable, meaning that they generate proof against
   any revocation tree root hash, because the verification will be skipped.
3. For revocable credentials, the merkle root 0 meaning that no credential has been revoked.
   Circuit will skip merkle proof verification when the root is 0.

## NOTICE

For better bundling experience for end users, we make manually copied the browser bundled version of `eta` into site-packages.
