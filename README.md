# Open Music Streaming

A decentralised music streaming platform built on the ATProtocol.

## Development Environment

Getting an ATProtocol application development enviornment setup is hard. There are a lot of pieces which aren't well documented and it seems like everybody has to tweak things a little bit for particular use case.

Shout out to [natalie.sh](https://natalie.sh) on the [ATProto Touchers Discord](https://discord.com/channels/1097580399187738645/1329137337711722536/1360776794726465679) for sharing [Nick Gerakine's](https://ngerakines.me/) ([SmokeSignal Events](https://smokesignal.events/)) guide on [Building and testing atprotocol applications](https://blog.smokesignal.events/posts/3ltg5xg3me22c-3ltg5xg3me22c-building-and-testing-atprotocol-applications)

These are things I felt would be useful to share after spending the day getting this running.

### DNS Rebinding and Cloudflare Tunnel

The guide has you setup a real domain with `A` records that resolve to `127.0.0.1`. It is not uncommon for ISPs (or their hardware) to block DNS requests which resolve to private IP addresses as it can be used for [DNS rebinding attacks](https://en.wikipedia.org/wiki/DNS_rebinding).

To get around this limitation, I instead used a [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/). When setting up the tunnel, `CNAME` records are created which point to the tunnel that redirects traffic to the cloudflared container.

The tunnel's Published Application Routes tell the cloudflared container to send HTTP traffic to the caddy container. I chose to expose port 80 from the Caddy container to the host, so I set my Published Application Routes to `host.docker.internal` (macOS), but you could also just point it to `caddy`.

Because all of our DNS records are behind Cloudflare's proxy, we get SSL certificates from a trusted CA. This allows us to avoid the tls config in the Caddyfile, the `CURL_CA_BUNDLE`s, and the `NODE_EXTRA_CA_CERTS`.

### Repositories

Because nobody likes Git Submodules, there are a couple of repositories which are needed to get up and running.

- [did-method-plc](https://github.com/did-method-plc/did-method-plc) - Contains the Dockerfile to build the PLC container
- [bluesky-social/pds](https://github.com/bluesky-social/pds) - Contains the pdsadmin.sh to create accounts on the PDS
- _(optional)_ [bluesky-social/atproto](https://github.com/bluesky-social/atproto) - Helpful for debugging as it contains the source code for the PDS iamge.

### Environment Variables

- Create your own .env files from the examples provided
  ```sh
  cp .env.example .env                # Docker Compose variables
  cp pds.env.example pds.env.example  # PDS environment variables
  ```
- The `PORT` environment variable on the PLC is missing in the guide. It defaults to 3000, but I set it to 2582 in the compose.yml
- The pds.env.example contains all of the necessary variables to run a PDS, except for `PDS_JWT_SECRET` and `PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX`. You can generate those with the following commands:

  ```sh
  # PDS_JWT_SECRET
  openssl rand --hex 16

  # PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX
  openssl ecparam --name secp256k1 --genkey --noout --outform DER | tail --bytes=+8 | head --bytes=32 | xxd --plain --cols 32
  ```

- Don't forget to comment out the root user check in the pdsadmin.sh!

### Forbidden sec-fetch-site header "same-site"

The PDS doesn't expect to be hosted on the same domain as the app (`bluesky.social` vs `bsky.app`). When trying to authenticate through our app, we get an error from the PDS:

```
BadRequestError: Forbidden sec-fetch-site header "same-site" (expected cross-site,none)
```

There's an open [issue on GitHub](https://github.com/bluesky-social/atproto/issues/4131) about this. Shout out to [@mary-ext](https://mary.my.id/) for providing a [patch](https://github.com/mary-ext/pds-docker/commit/56c2090300a71f4af779f7243bdcaab7864f8fea).

The PDS now runs from a Dockerfile where the patch agets applied on top of the existing `bluesky-social/pds` image.

### Useful Commands

```sh
# Destroy everything
docker-compose down -v

# App database migrations
# Note: Run from ./api
pnpm prisma db push

# Create account on PDS
# Note: Run from atproto/pds repo. Don't forget to copy pds.env
PDS_ENV_FILE=pds.env ./pdsadmin.sh account create andrew@pds.aelitneg.xyz andrew.aelitneg.xyz
```
