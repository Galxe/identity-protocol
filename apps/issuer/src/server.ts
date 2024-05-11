require("dotenv-flow").config({
  default_node_env: "development",
});
import * as grpc from "@grpc/grpc-js";
import * as pb from "@/grpc/issuer/v1/issuer.js";
import { Logger } from "tslog";
import { GenerateSignedCredential } from "@/issuer/handler.js";
import { createServer, IncomingMessage, ServerResponse } from "http";
import assert from "assert";
import { babyzk } from "@galxe-identity-protocol/sdk";

const ISSUER_PK = process.env.ISSUER_PK;
assert(ISSUER_PK != undefined);

const ISSUER_ID = process.env.ISSUER_ID;
assert(ISSUER_ID != undefined);

const logger = new Logger({ name: "grpc" });

class Server implements pb.IssuerServiceServer {
  [key: string]: grpc.UntypedHandleCall;

  public ping(
    _: grpc.ServerUnaryCall<pb.PingRequest, pb.PingResponse>,
    callback: grpc.sendUnaryData<pb.PingResponse>
  ): void {
    callback(null, pb.PingResponse.fromPartial({}));
  }

  public generateSignedCredential(
    call: grpc.ServerUnaryCall<pb.GenerateSignedCredentialRequest, pb.GenerateSignedCredentialResponse>,
    callback: grpc.sendUnaryData<pb.GenerateSignedCredentialResponse>
  ): void {
    GenerateSignedCredential(call.request, ISSUER_ID!, ISSUER_PK!)
      .then(res => callback(null, res))
      .catch(err => callback(err, null));
  }
}

async function start() {
  // prepare babyzk
  await babyzk.prepare();

  // setup gRPC server
  const server = new grpc.Server();
  server.addService(pb.IssuerServiceService, new Server());

  const port = process.env.SERVER_PORT || 9090;
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err: Error | null, bindPort: number) => {
      if (err) {
        throw err;
      }

      logger.info(`gRPC:Server:${bindPort}`, new Date().toLocaleString());
    }
  );

  // start dummy healthcheck server
  const healthPort = process.env.HEALTH_PORT || 8080;
  const dummyHealthServer = createServer((_: IncomingMessage, resp: ServerResponse) => {
    resp.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain",
    });
    resp.write("ok");
    resp.end();
  });
  dummyHealthServer.listen(healthPort);
}
start();
