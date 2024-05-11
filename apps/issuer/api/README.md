# Generate protobuf
```
$ cd proto
$ buf generate
```
# Setup
## Buf
```
$ brew install bufbuild/buf/buf
```
## Go
```
$ go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
$ go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```
## Typescript
```
$ cd ts/
$ yarn install
```