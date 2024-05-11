import { solidityPackedKeccak256 } from "ethers";
import { keccak256 } from "hardhat/internal/util/keccak";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function calCredTypeID(creator: string, name: string): bigint {
  return (
    BigInt(solidityPackedKeccak256(["uint160", "string"], [BigInt(creator), name])) &
    BigInt("0x00ffffffffffffffffffffffffffffffffffffffff")
  );
}

export function calContextID(context: string): bigint {
  return (
    BigInt("0x" + keccak256(Buffer.from(context)).toString("hex")) &
    BigInt("0x00ffffffffffffffffffffffffffffffffffffffff")
  );
}
