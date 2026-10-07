import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { get, post, getToken, setToken, whenSignedOut } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const data = await get('/auth/me');
      setUser(data.user);
      setProfileComplete(data.profile_complete);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    whenSignedOut((message) => {
      setUser(null);
      setNotice(message || 'Please sign in again.');
    });
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await post('/auth/login', { email, password });
    setToken(data.token);
    setNotice('');
    setUser(data.user);
    const me = await get('/auth/me');
    setProfileComplete(me.profile_complete);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      profileComplete,
      notice,
      login,
      logout,
      refresh,
      setUser: (u, complete) => {
        setUser(u);
        if (complete !== undefined) setProfileComplete(complete);
      },
    }),
    [user, loading, profileComplete, notice, login, logout, refresh]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}

// Where each role lands after signing in.
export function homeFor(user) {
  if (!user) return '/sign-in';
  if (user.role === 'Super Admin') return '/super/accounts';
  if (user.role === 'Admin') return '/admin';
  if (user.role === 'Incharge') return '/incharge/bookings';
  return '/rooms';
}
