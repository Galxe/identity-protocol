# Self-sovereign type setup

## Dependencies

You must have the following installed on your machine:

- circom
- node and ts-node
- basic unix tools like mv, cp, rm, etc.
- save ptaus files into `./ptaus` folder. Naming convention: `powersOfTau28_hez_final_**.ptau`, e.g., `powersOfTau28_hez_final_08.ptau`

For how to download ptaus files, see [here](https://github.com/iden3/snarkjs?tab=readme-ov-file#7-prepare-phase-2).

```bash
# Example: Download ptaus file of size 14 to ./ptaus folder
wget -P ptaus https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau
```

## Usage

First, install dependencies by `pnpm install` or `yarn install`.

Now let's setup a type. For example, let's setup a type called `fancy` with the following type definition:

```text
@revocable(16);balance:uint<160>;happy:prop<8,c,1>;cool:bool;
```

Assuming the creator of the type is `0xd8da6bf26964af9d7eed9e03e53415d37aa96045`. The output directory is `./build/fancy`.

Simply run the following command:

```bash
pnpm start setup-type --name fancy --typedef "@revocable(16);balance:uint<160>;happy:prop<8,c,1>;cool:bool;" --creator "0xd8da6bf26964af9d7eed9e03e53415d37aa96045" --outputDir ./build/fancy
```

You can find more example in `src/primitiveTypeSetup.ts`, using primitive types setup as examples.
