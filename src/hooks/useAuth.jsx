import { createContext, useContext, useEffect, useState } from "react";
import { getUserSession, setUserSession, clearUserSession } from "@/lib/store";

const AuthContext = createContext({
  session: null,
  login: async () => {},
  logout: async () => {},
  isLoggedIn: false,
  loading: true,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await getUserSession();
        if (mounted) setSession(stored);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (role, name) => {
    const s = { role, name };
    await setUserSession(s);
    setSession(s);
  };

  const logout = async () => {
    await clearUserSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, isLoggedIn: !!session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

