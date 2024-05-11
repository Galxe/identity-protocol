import type { TypeSpec } from "./credTypeUtils";

const defaultPublicSignalGetter = "0x1418b5e79eE53396dE4a454d78DF2ab522CE24CC";

export const unit: TypeSpec = {
  type_id: 1n,
  name: "Unit",
  definition: "",
  description: "Unit type",
  resource_meta_uri: "ipfs://QmX8dx6onZornDd5wsM2raWDz1prRrjLcrNwgZHWonYHvw",
  resources: {
    babyzk: {
      circom_uri: "ipfs://QmW4SgG4pDDLyFLy7V12QxMSx5X7tAqyeA4kgEFR1oURba/circuit.circom",
      verifier_uri: "ipfs://QmW4SgG4pDDLyFLy7V12QxMSx5X7tAqyeA4kgEFR1oURba/verifier.sol",
      vkey_uri: "ipfs://QmW4SgG4pDDLyFLy7V12QxMSx5X7tAqyeA4kgEFR1oURba/circuit.vkey.json",
      witness_wasm_uri: "ipfs://QmW4SgG4pDDLyFLy7V12QxMSx5X7tAqyeA4kgEFR1oURba/circom.wasm",
      zkey_uri: "ipfs://QmW4SgG4pDDLyFLy7V12QxMSx5X7tAqyeA4kgEFR1oURba/circuit_final.zkey",
    },
  },
  contractAddrs: {
    babyzk: {
      proof_verifier: "0x4B8794e78E27B8eb9d57E7566E657C23C747f3b4",
      pulic_signal_getter: defaultPublicSignalGetter,
    },
  },
};

export const boolean: TypeSpec = {
  type_id: 2n,
  name: "Boolean",
  definition: "val:bool;",
  description: "Boolean type",
  resource_meta_uri: "ipfs://QmZQBtQ8nxcUM6fLgG4NrFkgmZwpjgcqPz8PQwgvRbpNQK",
  resources: {
    babyzk: {
      circom_uri: "ipfs://QmbKa6j8SNxVbfqfwGfDT9jxzFpHLUKwmUqPADEW86QBa6/circuit.circom",
      verifier_uri: "ipfs://QmbKa6j8SNxVbfqfwGfDT9jxzFpHLUKwmUqPADEW86QBa6/verifier.sol",
      vkey_uri: "ipfs://QmbKa6j8SNxVbfqfwGfDT9jxzFpHLUKwmUqPADEW86QBa6/circuit.vkey.json",
      witness_wasm_uri: "ipfs://QmbKa6j8SNxVbfqfwGfDT9jxzFpHLUKwmUqPADEW86QBa6/circom.wasm",
      zkey_uri: "ipfs://QmbKa6j8SNxVbfqfwGfDT9jxzFpHLUKwmUqPADEW86QBa6/circuit_final.zkey",
    },
  },
  contractAddrs: {
    babyzk: {
      proof_verifier: "0x03d01B9d3F3eF125bdfC4a66DCb4362d4064E522",
      pulic_signal_getter: defaultPublicSignalGetter,
    },
  },
};

export const scalar: TypeSpec = {
  type_id: 3n,
  name: "Scalar",
  definition: "val:uint<248>;",
  description: "248-bit unsigned integer Scalar type",
  resource_meta_uri: "ipfs://QmPABvgq3Rnu8jqMjXx2HhHAY9h9EL2Q2ZizAUZwVFuNfn",
  resources: {
    babyzk: {
      circom_uri: "ipfs://QmbfUi522GimkZKvvmFjHTVKDhrU9UrtMb58JoDhtFHd1j/circuit.circom",
      verifier_uri: "ipfs://QmbfUi522GimkZKvvmFjHTVKDhrU9UrtMb58JoDhtFHd1j/verifier.sol",
      vkey_uri: "ipfs://QmbfUi522GimkZKvvmFjHTVKDhrU9UrtMb58JoDhtFHd1j/circuit.vkey.json",
      witness_wasm_uri: "ipfs://QmbfUi522GimkZKvvmFjHTVKDhrU9UrtMb58JoDhtFHd1j/circom.wasm",
      zkey_uri: "ipfs://QmbfUi522GimkZKvvmFjHTVKDhrU9UrtMb58JoDhtFHd1j/circuit_final.zkey",
    },
  },
  contractAddrs: {
    babyzk: {
      proof_verifier: "0x1ec111fc8aEAcCD989d6F7c556b12575cAc3a7E0",
      pulic_signal_getter: defaultPublicSignalGetter,
    },
  },
};

export const scalar256: TypeSpec = {
  type_id: 4n,
  name: "Scalar256",
  definition: "val:uint<256>;",
  description: "256-bit unsigned integer Scalar type",
  resource_meta_uri: "ipfs://QmRUR9uyzJ9fL9SodKEB2yA43aez3axHJH9m3Myu8nsv4o",
  resources: {
    babyzk: {
      circom_uri: "ipfs://QmexX6xb3Q7rJYjAYc5o2CUum6gramxcpoBC1DNFVKaWy1/circuit.circom",
      verifier_uri: "ipfs://QmexX6xb3Q7rJYjAYc5o2CUum6gramxcpoBC1DNFVKaWy1/verifier.sol",
      vkey_uri: "ipfs://QmexX6xb3Q7rJYjAYc5o2CUum6gramxcpoBC1DNFVKaWy1/circuit.vkey.json",
      witness_wasm_uri: "ipfs://QmexX6xb3Q7rJYjAYc5o2CUum6gramxcpoBC1DNFVKaWy1/circom.wasm",
      zkey_uri: "ipfs://QmexX6xb3Q7rJYjAYc5o2CUum6gramxcpoBC1DNFVKaWy1/circuit_final.zkey",
    },
  },
  contractAddrs: {
    babyzk: {
      proof_verifier: "0x5F6CFf23e9A4f63e934891eE8eb6071423385aD0",
      pulic_signal_getter: defaultPublicSignalGetter,
    },
  },
};

export const property: TypeSpec = {
  type_id: 5n,
  name: "Property",
  definition: "val:prop<248,c,1>;",
  description: "248-bit property type with user-defined hash",
  resource_meta_uri: "ipfs://QmUv7qrsaaFFUDTouNCRQ8SF6B7UewQGNpANBFuqh6vdw3",
  resources: {
    babyzk: {
      circom_uri: "ipfs:///circuit.circom",
      verifier_uri: "ipfs://QmQCsk37Cx3Yniy4qp63w2X9fexLW1NCcmjw3qKS7QEzFm/verifier.sol",
      vkey_uri: "ipfs://QmQCsk37Cx3Yniy4qp63w2X9fexLW1NCcmjw3qKS7QEzFm/circuit.vkey.json",
      witness_wasm_uri: "ipfs://QmQCsk37Cx3Yniy4qp63w2X9fexLW1NCcmjw3qKS7QEzFm/circom.wasm",
      zkey_uri: "ipfs://QmQCsk37Cx3Yniy4qp63w2X9fexLW1NCcmjw3qKS7QEzFm/circuit_final.zkey",
    },
  },
  contractAddrs: {
    babyzk: {
      proof_verifier: "0x97194020ac576aA8a08c954DebFe14Ca583415AC",
      pulic_signal_getter: defaultPublicSignalGetter,
    },
  },
};

const passportTypeDef = `birthdate:uint<64>;
gender:prop<8,c,1>;
id_country:prop<16,c,1>;
id_class:prop<8,c,1>;
issue_date:uint<64>;
first_verification_date:uint<64>;
last_selfie_date:uint<64>;
total_sefie_verified:uint<8>`;

/**
 * Passport type is not an official primitive type. But since it is a good example of a complex type,
 * we set it up as an primitive type of ID 10000, here as a reference.
 */
export const passport: TypeSpec = {
  type_id: 10000n,
  name: "Galxe Passport v2",
  definition: passportTypeDef,
  description: "Galxe Passport v2 type",
  resource_meta_uri: "ipfs://QmZ4UghikEohVtpJaiAQorBeHNPFZ9vq5TfnE8jTAyLU9k",
  resources: {
    babyzk: {
      circom_uri: "ipfs://QmeCNjA3K44h9neJiDs33fmHar5TySNmHrRmJp4RJ9YmE6/circuit.circom",
      verifier_uri: "ipfs://QmeCNjA3K44h9neJiDs33fmHar5TySNmHrRmJp4RJ9YmE6/verifier.sol",
      vkey_uri: "ipfs://QmeCNjA3K44h9neJiDs33fmHar5TySNmHrRmJp4RJ9YmE6/circuit.vkey.json",
      witness_wasm_uri: "ipfs://QmeCNjA3K44h9neJiDs33fmHar5TySNmHrRmJp4RJ9YmE6/circom.wasm",
      zkey_uri: "ipfs://QmeCNjA3K44h9neJiDs33fmHar5TySNmHrRmJp4RJ9YmE6/circuit_final.zkey",
    },
  },
  contractAddrs: {
    babyzk: {
      proof_verifier: "0xCA355CE1D55670F7CE29Bb2d23061fe041Fd4B35",
      pulic_signal_getter: defaultPublicSignalGetter,
    },
  },
};
