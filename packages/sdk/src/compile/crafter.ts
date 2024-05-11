import axios, { AxiosResponse } from "axios";
import { CompileError, ErrorName } from "@/errors";

export type CrafterCompileResponse<T = CrafterCompileCircomResponseData | CrafterCompileSolidityResponseData> = {
  code: number; // 0: fail, 1: success
  error: string;
  data: T;
};

export type CrafterCompileCircomResponseData = {
  circom: string;
  verificationKey: string;
  wasm: string;
  zkey: string;
};

export type CrafterCompileSolidityResponseData = {
  solidity: string;
  abi: string;
};

export type CompileCircomParams = {
  typeId: string;
  typeName: string;
  typeCircom: string;
};

export type CompileSolidityParams = {
  typeId: string;
  verifierSolidity: string;
};

export async function compileByCrafter<T = CrafterCompileCircomResponseData | CrafterCompileSolidityResponseData>(
  crafterUrl: string,
  params: CompileCircomParams | CompileSolidityParams
): Promise<T> {
  try {
    const response: AxiosResponse<CrafterCompileResponse<T>> = await axios.post(crafterUrl, params, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.data.code !== 1) {
      // compile fail
      throw new CompileError(ErrorName.CompileFailed, response.data.error);
    }
    return response.data.data;
  } catch (err: unknown) {
    if (err instanceof CompileError) {
      throw err;
    }
    if (axios.isAxiosError(err)) {
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new CompileError(ErrorName.CompileFailed, `crafter server error: ${err.response.data}`);
      } else if (err.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser
        // and an instance of http.ClientRequest in node.js
        throw new CompileError(ErrorName.CompileFailed, `request crafter error: ${err.request}`);
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new CompileError(ErrorName.CompileFailed, `request crafter error: ${err.message}`);
      }
    } else {
      throw new CompileError(ErrorName.CompileFailed, `unknown error: ${err}`);
    }
  }
}
