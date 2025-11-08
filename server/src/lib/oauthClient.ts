import { NodeOAuthClient } from '@atproto/oauth-client-node';
import { StateStore, SessionStore } from '@/lib/oauthStorage';
import { db } from '@/lib/db';

const enc = encodeURIComponent;

const publicUrl = process.env.PUBLIC_URL;
const url = publicUrl || `http://127.0.0.1:8080`;

export const oauthClient = new NodeOAuthClient({
  clientMetadata: {
    client_name: 'Music Streaming',
    client_id: publicUrl
      ? `${url}/client-metadata.json`
      : `http://localhost?redirect_uri=${enc(`${url}/oauth/callback`)}&scope=${enc('atproto transition:generic')}`,
    client_uri: url,
    redirect_uris: [`${url}/oauth/callback`],
    scope: 'atproto transition:generic',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    application_type: 'web',
    token_endpoint_auth_method: 'none',
    dpop_bound_access_tokens: true,
  },
  stateStore: new StateStore(db),
  sessionStore: new SessionStore(db),
});
