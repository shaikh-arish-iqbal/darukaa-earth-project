/**
 * useAuth hook
 * ============
 * Provides authentication state and actions (login, logout, register)
 * to any component that needs it.
 *
 * This is a simple hook — not a full Context provider — because
 * the app is small and this keeps the code easy to follow.
 */

import { useState, useEffect } from "react";
import { authApi } from "../services/api";
import { saveToken, removeToken, getToken } from "../utils/auth";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if a token exists and fetch the current user
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => removeToken())
      .finally(() => setLoading(false));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function login(email, password) {
    const res = await authApi.login(email, password);
    saveToken(res.data.access_token);
    const meRes = await authApi.me();
    setUser(meRes.data);
    return meRes.data;
  }

  async function register(name, email, password) {
    await authApi.register(name, email, password);
    // After registering, automatically log in
    return login(email, password);
  }

  function logout() {
    removeToken();
    setUser(null);
  }

  return { user, loading, login, register, logout };
}
