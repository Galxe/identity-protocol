# Protocol Issuer

This is a microservice that issues credentials via GRPC.

## Run

Required environment variables:

- ISSUER_PK: Private key to sign the credential
- ISSUER_ID: Issuer ID

## Build and push the issuer image

From repository root folder, run:

```bash
docker build --platform="linux/amd64" --target issuer -t <target>:<tag> -f apps/issuer/Dockerfile .
docker push <target>:<tag>
```
