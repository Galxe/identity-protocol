import { babyzk } from "@/babyzk";
import * as babyzkTypes from "@/babyzk/types";
import * as hash from "@/crypto/hash";
import * as smt from "@/crypto/smt";
import * as claimType from "@/credential/claimType";
import * as credType from "@/credential/credType";
import * as claimValue from "@/credential/claimValue";
import * as credential from "@/credential/credential";
import * as statement from "@/credential/statement";
import * as user from "@/roles/user";
import * as issuer from "@/roles/issuer";
import * as evm from "@/evm";

import * as utils from "@/utils";
import * as errors from "@/errors";

// currently, there is a hard dependency on prepare in babyzk, due to poseidon hash
// implementation. So we export it here for now.
const prepare = babyzk.prepare;

export {
  babyzk,
  babyzkTypes,
  hash,
  smt,
  claimType,
  credType,
  claimValue,
  credential,
  statement,
  evm,
  user,
  issuer,
  utils,
  errors,
  prepare,
};
