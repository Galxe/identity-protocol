# Galxe Identity Protocol EVM Contracts

This repository houses the Typescript adaptors for the Galxe Identity Protocol EVM contracts. The adaptors are generated
using the `typechain` package, for the `ethers` v6 library. Solidity contracts are located in the `contracts` directory.

## Commands

```bash
pnpm clean
pnpm compile
pnpm build
pnpm lint
pnpm test
```

## Contract Address List

### Registry contracts

```json
{
  "TypeRegistry": "0x77dA3Cf4418009D171B4963db815Ca46d6F2E79D",
  "ContextRegistry": "0x42D6444840842F0484C1624899c9a3E835738592",
  "IssuerRegistry": "0xc4525dA874A6A3877db65e37f21eEc0b41ef9877"
}
```

### Babyzk verification stack

```json
{
  "BabyzkDefaultPublicSignalGetter": "0x1418b5e79eE53396dE4a454d78DF2ab522CE24CC",
  "BabyzkStatefulVerifier": "0xF3D3404eb75D076Ab8A0F728C7FAA3c0A5e6549F"
}
```

#### Primitive type static verifier contracts

```json
{
  "BabyZKGroth16UnitVerifier": "0x4B8794e78E27B8eb9d57E7566E657C23C747f3b4",
  "BabyZKGroth16BooleanVerifier": "0x03d01B9d3F3eF125bdfC4a66DCb4362d4064E522",
  "BabyZKGroth16ScalarVerifier": "0x1ec111fc8aEAcCD989d6F7c556b12575cAc3a7E0",
  "BabyZKGroth16Scalar256Verifier": "0x5F6CFf23e9A4f63e934891eE8eb6071423385aD0",
  "BabyZKGroth16PropertyVerifier": "0x97194020ac576aA8a08c954DebFe14Ca583415AC",
  "BabyZKGroth16PassportVerifier": "0xCA355CE1D55670F7CE29Bb2d23061fe041Fd4B35"
}
```
