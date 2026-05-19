# 0001: PDS Blobs for Media Storage

**Date:** 2026-05-17
**Status:** Accepted

## Context

Multiple decentralisation strategies are being evaluated for use in the ecosystem. The two favourites are [AT Protocol](https://atproto.com/) and [RSS](https://www.rssboard.org/rss-specification). One of the critical factors is the hosting of media files.

Serving public media files from RSS is trivial. Multiple authorisation implementations can be realised, however there exists no single standardised approach to this.

With AT Protocol, the PDS provides authorisation for free. The tradeoff is that we do not own the PDS application and are subject to its limitations.

The most relevant limitation is the maximum allowed size of blob uploads. Bluesky is the largest provider of PDS in the Atmosphere. According to their [docs](https://docs.bsky.app/docs/advanced-guides/rate-limits):

> The PDS also applies a maximum size limit on individual blob uploads (separate from any application-specific blob size limit). The current limit is 52,428,800 bytes (50 MByte).

Other providers as well as independently hosted PDS may have a different limit.

This limit only affects artists as they will need to be using a PDS capable of handling blobs of the music they wish to distribute.

## Decision

The decision was made to accept the 50 MB limit imposed by the PDS in exchange for not having to implement authorisation in a standardised way. This limit should be enough to satisfy high quality music files. 

## Consequences

- Artists will need to be using PDS which are capable of handling the size of their uploads
- In the event the limit changes in the future a decision will need to be made whether to provide support for self-hosting / migrating a PDS and / or creating a PDS product to suit our needs.
