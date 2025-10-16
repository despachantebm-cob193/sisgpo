const jwt = require('jsonwebtoken');

const DEFAULT_AUDIENCE = process.env.SSO_AUDIENCE || 'ocorrencias';
const DEFAULT_ISSUER = process.env.SSO_ISSUER || 'sisgpo';
const DEFAULT_ALGORITHM = process.env.SSO_ALGORITHM || 'HS256';
const DEFAULT_EXPIRES_IN_SECONDS = Number(process.env.SSO_TOKEN_TTL_SECONDS || 120);

function getSharedSecret() {
  const secret = process.env.SSO_SHARED_SECRET;
  if (!secret) {
    throw new Error(
      'SSO_SHARED_SECRET is not defined. Configure it in the environment before issuing SSO tokens.'
    );
  }
  return secret;
}

/**
 * Generates a short-lived JWT used for SSO between SISGPO and the occurrences system.
 * @param {object} [options]
 * @param {string} [options.audience] - Aud claim. Defaults to "ocorrencias".
 * @param {string} [options.issuer] - Iss claim. Defaults to "sisgpo".
 * @param {number} [options.expiresInSeconds] - Expiration in seconds. Defaults to 120.
 * @param {object} [options.additionalClaims] - Extra custom claims for the payload.
 * @returns {string} Signed JWT string.
 */
function signSsoJwt(options = {}) {
  const secret = getSharedSecret();

  const audience = options.audience || DEFAULT_AUDIENCE;
  const issuer = options.issuer || DEFAULT_ISSUER;
  const expiresInSeconds =
    typeof options.expiresInSeconds === 'number'
      ? options.expiresInSeconds
      : DEFAULT_EXPIRES_IN_SECONDS;

  const payload = {
    system: issuer,
    ...(options.additionalClaims || {}),
  };

  return jwt.sign(payload, secret, {
    algorithm: DEFAULT_ALGORITHM,
    audience,
    issuer,
    expiresIn: expiresInSeconds,
  });
}

/**
 * Returns a headers object merged with the Authorization bearer token issued by signSsoJwt.
 * @param {object} [options]
 * @param {object} [options.headers] - Existing headers to be merged.
 * @returns {{Authorization: string}}
 */
function buildSsoAuthHeaders(options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const token = signSsoJwt(options);
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Composes a generic request config with SSO Authorization header.
 * Useful when creating axios/fetch configs.
 * @param {object} [config] - Existing request config.
 * @param {object} [options] - Options forwarded to signSsoJwt/buildSsoAuthHeaders.
 * @returns {object}
 */
function withSsoAuth(config = {}, options = {}) {
  const headers = buildSsoAuthHeaders({ ...options, headers: config.headers });
  return {
    ...config,
    headers,
  };
}

module.exports = {
  signSsoJwt,
  buildSsoAuthHeaders,
  withSsoAuth,
};
