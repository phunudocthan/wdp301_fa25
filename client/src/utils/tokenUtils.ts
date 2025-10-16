/**
 * Utility functions for handling JWT tokens
 */

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Decode JWT token without verification (client-side only)
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if JWT token is expired
 * @param token JWT token string
 * @returns true if expired, false if valid
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;

  // Add 30 second buffer to account for server time differences
  const currentTime = Math.floor(Date.now() / 1000) + 30;
  return payload.exp < currentTime;
}

/**
 * Get valid token from localStorage or null if expired
 * @returns Valid token string or null
 */
export function getValidToken(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (isTokenExpired(token)) {
    localStorage.removeItem("token");
    return null;
  }

  return token;
}

/**
 * Clear expired token from localStorage
 */
export function clearExpiredToken(): void {
  const token = localStorage.getItem("token");
  if (token && isTokenExpired(token)) {
    localStorage.removeItem("token");
  }
}
