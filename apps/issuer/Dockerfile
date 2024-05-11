# Note: must call docker build in root directory

# Use a Node.js base image
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Update the package lists and install Python3 and pip
RUN apt-get update && apt-get install -y python3 python3-pip && ln -s /usr/bin/python3 /usr/bin/python && rm -rf /var/lib/apt/lists/*

FROM base AS build

# Copy root directory
COPY . /workspace
WORKDIR /workspace
RUN ls /workspace
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build
# Note: we can't use deploy here due to https://github.com/pnpm/pnpm/issues/6269
# RUN pnpm deploy --filter=issuer --prod /prod/issuer

FROM base AS issuer
# node_modules are symlinked to root directory, so we just copy the whole thing for now
COPY --from=build /workspace /workspace
# COPY --from=build /prod/issuer /prod/issuer
WORKDIR /workspace/apps/issuer
EXPOSE 8080 9090
CMD [ "pnpm", "start" ]
# docker build . --target issuer --tag issuer:latest
