FROM ghcr.io/bluesky-social/pds:0.4

# Install patch utility (required for applying the patch)
RUN apk add --no-cache patch

# Apply patch to allow same-site sec-fetch-site header
# This fixes the issue where OAuth authorization fails when PDS and client are on the same domain
# See: https://github.com/bluesky-social/atproto/issues/4131
# Patch source: https://github.com/mary-ext/pds-docker/commit/56c2090300a71f4af779f7243bdcaab7864f8fea
COPY @atproto__oauth-provider.patch /tmp/
RUN cd /app/node_modules/.pnpm/@atproto+oauth-provider@0.13.4/node_modules/@atproto/oauth-provider && \
    patch -p1 < /tmp/@atproto__oauth-provider.patch
