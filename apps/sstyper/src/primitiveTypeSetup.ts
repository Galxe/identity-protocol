#!/usr/bin/env ts-node

import { setupType } from "./setupType";

export async function primitiveTypeSetup() {
  // unused, primitive types are deployed by the protocol
  const deployer = "";

  // not a primitive type in protocol's spec, but it's good to put it
  // as a primitive for showcasing purposes.
  const passport = `
birthdate:uint<64>;
gender:prop<8,c,1>;
id_country:prop<16,c,1>;
id_class:prop<8,c,1>;
issue_date:uint<64>;
first_verification_date:uint<64>;
last_selfie_date:uint<64>;
total_sefie_verified:uint<8>
`;

  const passportv2d1 = `
birthdate:uint<64>; 
gender:prop<8,c,1>; 
id_country:prop<16,c,1>; 
id_class:prop<8,c,1>; 
document_expiration_date:uint<64>; 
proof_of_time:uint<64>; 
last_revoke_time:uint<64>; 
last_selfie_date:uint<64>; 
total_sefie_verified:uint<8>;
`;

  await setupType("Unit", "", deployer, "build/unit/", 1);
  await setupType("Boolean", "val:bool;", deployer, "build/boolean/", 2);
  await setupType("Scalar", "val:uint<248>;", deployer, "build/scalar/", 3);
  await setupType("Scalar256", "val:uint<256>;", deployer, "build/scalar256/", 4);
  await setupType("Property", "val:prop<248,c,1>;", deployer, "build/property/", 5);
  await setupType("Galxe Passport v2", passport, deployer, "build/passport/", 10000);
  await setupType("Galxe Passport v2.1", passportv2d1, deployer, "build/passportv2d1/", 10001);
}

async function main() {
  await primitiveTypeSetup();
  process.exit(0);
}

main();
