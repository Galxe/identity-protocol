import { Options } from "./base";
import { TypeRegistry } from "./typeRegistry";
import { ContextRegistry } from "./contextRegistry";
import { IssuerRegistry } from "./issuerRegistry";
import { PublicSignalGetter } from "./publicSignalGetter";
import { BabyzkStatefulVerifier } from "./babyzk/statefulProofVerifier";
import { AggregatedBabyzkStatefulVerifier } from "./babyzk/aggregatedStatefulProofVerifier";

// Addresses of the deployed contracts for the v1 version of the protocol.
export const addresses = {
  TypeRegistry: "0x77dA3Cf4418009D171B4963db815Ca46d6F2E79D",
  ContextRegistry: "0x42D6444840842F0484C1624899c9a3E835738592",
  IssuerRegistry: "0xc4525dA874A6A3877db65e37f21eEc0b41ef9877",
  BabyzkDefaultPublicSignalGetter: "0x1418b5e79eE53396dE4a454d78DF2ab522CE24CC",
  BabyzkStatefulVerifier: "0xF3D3404eb75D076Ab8A0F728C7FAA3c0A5e6549F",
  AggregatedBabyzkStatefulVerifier: "0x217F3a88653F84C26ce159BC5417d9A54e6eA7F1",
};

/**
 * Creates a new instance of the TypeRegistry contract using v1 addresses.
 */
export function createTypeRegistry(options?: Options): TypeRegistry {
  return new TypeRegistry(addresses.TypeRegistry, options);
}

/**
 * Creates a new instance of the ContextRegistry contract using v1 addresses.
 */
export function createContextRegistry(options?: Options): ContextRegistry {
  return new ContextRegistry(addresses.ContextRegistry, options);
}

/**
 * Creates a new instance of the IssuerRegistry contract using v1 addresses.
 */
export function createIssuerRegistry(options?: Options): IssuerRegistry {
  return new IssuerRegistry(addresses.IssuerRegistry, options);
}

/**
 * Creates a new instance of the PublicSignalGetter contract using v1 addresses.
 */
export function createBabyzkDefaultPublicSignalGetter(options?: Options): PublicSignalGetter {
  return new PublicSignalGetter(addresses.BabyzkDefaultPublicSignalGetter, options);
}

/**
 * Creates a new instance of the BabyzkStatefulVerifier contract using v1 addresses.
 */
export function createBabyzkStatefulVerifier(options?: Options): BabyzkStatefulVerifier {
  return new BabyzkStatefulVerifier(addresses.BabyzkStatefulVerifier, options);
}

/**
 * Creates a new instance of the AggregatedBabyzkStatefulVerifier contract using v1 addresses.
 */
export function createAggregatedBabyzkStatefulVerifier(options?: Options): AggregatedBabyzkStatefulVerifier {
  return new AggregatedBabyzkStatefulVerifier(addresses.AggregatedBabyzkStatefulVerifier, options);
}
