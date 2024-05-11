/**
 * TypeResource is a list of URIs for the resources. Needed to generate a proof.
 * Each verification stack should have a corresponding TypeResourceList.
 */
export interface TypeResouceList {
  circom_uri: string;
  verifier_uri: string;
  vkey_uri: string;
  witness_wasm_uri: string;
  zkey_uri: string;
}

/**
 * TypeResourceList is a specification of JSON format for type resources.
 */
export interface TypeResourceMeta {
  babyzk: TypeResouceList;
}

/**
 * Parse a JSON string to TypeMetadataJsonSpec.
 */
export function parseTypeMetadataJsonSpec(json: string): TypeResourceMeta {
  const v = JSON.parse(json);
  // backward compatibility with old format that does not have verification stack
  // as a key to separate different verification stacks.
  if (v.babyzk === undefined) {
    return {
      babyzk: v,
    };
  }
  return v;
}

/**
 * TypeSpec is a specification of JSON format for type metadata.
 */
export interface TypeSpec {
  type_id: bigint;
  name: string;
  definition: string;
  description: string;
  resource_meta_uri: string;
  resources: TypeResourceMeta; // built-in resource URIs for the type
  contractAddrs: {
    babyzk: {
      proof_verifier: string;
      pulic_signal_getter: string;
    };
  };
}
