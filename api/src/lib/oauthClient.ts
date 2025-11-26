import assert from 'node:assert';
import {
  JoseKey,
  jwkSchema,
  Keyset,
  NodeOAuthClient,
  OAuthClientMetadataInput,
} from '@atproto/oauth-client-node';
import { db } from '@/lib/db';
import { StateStore, SessionStore } from '@/lib/oauthStorage';

export async function createOAuthClient() {
  assert(process.env.PUBLIC_URL, 'PUBLIC_URL is not set');
  assert(process.env.PRIVATE_KEYS, 'PRIVATE_KEYS are not set');

  // Parse private keys from environment
  const privateKeys = JSON.parse(process.env.PRIVATE_KEYS).map(
    (jwk: string | Record<string, unknown>) => jwkSchema.parse(jwk),
  );

  const keyset = new Keyset(
    await Promise.all(
      privateKeys.map((jwk: string | Record<string, unknown>) =>
        JoseKey.fromJWK(jwk),
      ),
    ),
  );

  // Private keys are required for publicly accessible clients
  assert(keyset?.size, 'Empty keyset after parsing PRIVATE_KEYS');
  const signingKey = keyset?.findPrivateKey({ usage: 'sign' });

  const clientMetadata: OAuthClientMetadataInput = {
    client_name: 'Open Music Streaming',
    client_id: `${process.env.PUBLIC_URL}/oauth-client-metadata.json`,
    jwks_uri: `${process.env.PUBLIC_URL}/.well-known/jwks.json`,
    redirect_uris: [`${process.env.CLIENT_URL}/oauth/callback`],
    scope: 'atproto transition:generic',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    application_type: 'web',
    token_endpoint_auth_method: 'private_key_jwt',
    token_endpoint_auth_signing_alg: signingKey.alg,
    dpop_bound_access_tokens: true,
  };

  return new NodeOAuthClient({
    keyset,
    clientMetadata,
    stateStore: new StateStore(db),
    sessionStore: new SessionStore(db),
    plcDirectoryUrl: process.env.PLC_URL || 'https://plc.directory',
    ...(process.env.PDS_URL && { handleResolver: process.env.PDS_URL }),
  });
}
