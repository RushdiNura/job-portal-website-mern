// import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
// import api, { getErrorMessage } from "../services/api.js";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const loadUser = useCallback(async () => {
//     const token = localStorage.getItem("jobnest_token");
//     if (!token) {
//       setLoading(false);
//       return;
//     }
//     try {
//       const { data } = await api.get("/auth/me");
//       setUser(data.user);
//     } catch {
//       localStorage.removeItem("jobnest_token");
//       localStorage.removeItem("jobnest_user");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadUser();
//   }, [loadUser]);

//   const login = async (email, password) => {
//     const { data } = await api.post("/auth/login", { email, password });
//     localStorage.setItem("jobnest_token", data.token);
//     setUser(data.user);
//     return data.user;
//   };

//   const register = async (payload) => {
//     const { data } = await api.post("/auth/register", payload);
//     localStorage.setItem("jobnest_token", data.token);
//     setUser(data.user);
//     return data.user;
//   };

//   const logout = () => {
//     localStorage.removeItem("jobnest_token");
//     localStorage.removeItem("jobnest_user");
//     setUser(null);
//   };

//   const updateUserLocal = (partial) => setUser((prev) => ({ ...prev, ...partial }));

//   return (
//     <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserLocal, getErrorMessage }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// };


import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api, { getErrorMessage } from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("jobnest_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      localStorage.removeItem("jobnest_token");
      localStorage.removeItem("jobnest_user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("jobnest_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("jobnest_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("jobnest_token");
    localStorage.removeItem("jobnest_user");
    setUser(null);
  };

  const updateUserLocal = (partial) =>
    setUser((prev) => ({ ...prev, ...partial }));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserLocal,
        getErrorMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
