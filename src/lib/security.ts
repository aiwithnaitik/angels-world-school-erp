const INSECURE_DEFAULT_JWT_SECRET = 'angels-world-school-erp-super-secure-jwt-secret-key-2026';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production.');
    }
    return 'development-only-angels-world-school-erp-secret-change-before-production';
  }

  if (process.env.NODE_ENV === 'production') {
    if (secret === INSECURE_DEFAULT_JWT_SECRET || secret.length < 32) {
      throw new Error('JWT_SECRET must be a unique production secret with at least 32 characters.');
    }
  }

  return secret;
}

export function getJwtSecretBytes() {
  return new TextEncoder().encode(getJwtSecret());
}

export function isMockDataAllowed() {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_DATA_IN_PRODUCTION === 'true';
}
