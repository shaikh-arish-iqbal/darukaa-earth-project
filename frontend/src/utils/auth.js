/**
 * Token storage utilities.
 * We store the JWT in localStorage so the user stays logged in on refresh.
 * For production, httpOnly cookies would be more secure, but localStorage
 * is simpler and acceptable for a hackathon demo.
 */

const TOKEN_KEY = "darukaa_token";

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}
