import { ethers } from "hardhat";

const passportTypeDef = `birthdate:uint<64>;
gender:prop<8,c,1>;
id_country:prop<16,c,1>;
id_class:prop<8,c,1>;
issue_date:uint<64>;
first_verification_date:uint<64>;
last_selfie_date:uint<64>;
total_sefie_verified:uint<8>`;

const passportv2d1TypeDef = `birthdate:uint<64>; 
gender:prop<8,c,1>; 
id_country:prop<16,c,1>; 
id_class:prop<8,c,1>; 
document_expiration_date:uint<64>; 
proof_of_time:uint<64>; 
last_revoke_time:uint<64>; 
last_selfie_date:uint<64>; 
total_sefie_verified:uint<8>;`;

const typeRegistry = "0x77dA3Cf4418009D171B4963db815Ca46d6F2E79D";
const defaultPublicSignalGetter = "0x1418b5e79eE53396dE4a454d78DF2ab522CE24CC";
const babyZKStackId = 1n;
const types = [
  {
    typeId: 1n,
    name: "Unit",
    definition: "",
    description: "Unit type",
    resourceUri: "ipfs://QmX8dx6onZornDd5wsM2raWDz1prRrjLcrNwgZHWonYHvw",
    proofVerifier: "0x4B8794e78E27B8eb9d57E7566E657C23C747f3b4",
  },
  {
    typeId: 2n,
    name: "Boolean",
    definition: "val:bool;",
    description: "Boolean type",
    resourceUri: "ipfs://QmZQBtQ8nxcUM6fLgG4NrFkgmZwpjgcqPz8PQwgvRbpNQK",
    proofVerifier: "0x03d01B9d3F3eF125bdfC4a66DCb4362d4064E522",
  },
  {
    typeId: 3n,
    name: "Scalar",
    definition: "val:uint<248>;",
    description: "248-bit unsigned integer Scalar type",
    resourceUri: "ipfs://QmPABvgq3Rnu8jqMjXx2HhHAY9h9EL2Q2ZizAUZwVFuNfn",
    proofVerifier: "0x1ec111fc8aEAcCD989d6F7c556b12575cAc3a7E0",
  },
  {
    typeId: 4n,
    name: "Scalar256",
    definition: "val:uint<256>;",
    description: "256-bit unsigned integer Scalar type",
    resourceUri: "ipfs://QmRUR9uyzJ9fL9SodKEB2yA43aez3axHJH9m3Myu8nsv4o",
    proofVerifier: "0x5F6CFf23e9A4f63e934891eE8eb6071423385aD0",
  },
  {
    typeId: 5n,
    name: "Property",
    definition: "val:prop<248,c,1>;",
    description: "248-bit property type with user-defined hash",
    resourceUri: "ipfs://QmUv7qrsaaFFUDTouNCRQ8SF6B7UewQGNpANBFuqh6vdw3",
    proofVerifier: "0x97194020ac576aA8a08c954DebFe14Ca583415AC",
  },
  {
    typeId: 10000n,
    name: "Galxe Passport v2",
    definition: passportTypeDef,
    description: "Galxe Passport v2 type",
    resourceUri: "ipfs://QmZ4UghikEohVtpJaiAQorBeHNPFZ9vq5TfnE8jTAyLU9k",
    proofVerifier: "0xCA355CE1D55670F7CE29Bb2d23061fe041Fd4B35",
  },
  {
    typeId: 10001n,
    name: "Galxe Passport v2.1",
    definition: passportv2d1TypeDef,
    description: "Galxe Passport v2.1 type",
    resourceUri: "ipfs://QmecKSb3LwjzxDjrMEt9MiszaLTAbRJAP1KduEYwLfuh2t",
    proofVerifier: "0xAb995d6b7eFc02A90dC1aF378bc27264da42c12F",
  },
];

async function main() {
  let typeRegistryContract = await ethers.getContractAt("TypeRegistry", typeRegistry);
  console.log("Type Registry address:", await typeRegistryContract.getAddress());
  const ownerAddress = await typeRegistryContract.owner();
  console.log("Owner address:", ownerAddress);
  const owner = await ethers.getSigner(ownerAddress);
  if (!owner) {
    throw new Error("Owner not found");
  }
  typeRegistryContract = typeRegistryContract.connect(owner);

  // Increase the gas price, if needed
  // const increasedGasPrice = BigInt("255566006468");

  for (let i = 0; i < types.length; i++) {
    if (await typeRegistryContract.isTypeFullyInitializedForStack(types[i].typeId, babyZKStackId)) {
      console.log(`Type ${types[i].name} already registered`);
      continue;
    }
    const typeConfig = {
      revocable: false,
      verificationStackId: babyZKStackId,
      verifier: types[i].proofVerifier,
      publicSignalGetter: defaultPublicSignalGetter,
    };
    const tx = await typeRegistryContract.setPrimitiveType(
      types[i].typeId,
      types[i].name,
      types[i].definition,
      types[i].description,
      types[i].resourceUri,
      typeConfig,
      // { gasPrice: increasedGasPrice }
    );
    console.log(`Type ${types[i].name} register with tx hash: ${tx.hash}`);
    await tx.wait();
    console.log(`Type ${types[i].name} registered`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
