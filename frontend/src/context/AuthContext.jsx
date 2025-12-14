import React, { createContext, useEffect, useMemo, useState } from "react";
import * as AuthAPI from "../api/auth";

export const AuthContext = createContext();

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("adr_user") || "null");
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  useEffect(() => {
    localStorage.setItem("adr_user", JSON.stringify(user));
  }, [user]);

  const setSession = (payload) => {
    // payload: { user, token }
    localStorage.setItem("adr_token", payload.token);
    setUser(payload.user);
  };

  const clearSession = () => {
    localStorage.removeItem("adr_token");
    localStorage.removeItem("adr_user");
    setUser(null);
  };

  // ✅ Signup should NOT auto-login (so user goes to login screen after signup)
  const signupUser = async (form) => {
    try {
      const data = await AuthAPI.signup(form);
      return { success: true, data };
    } catch (err) {
      const message = err?.response?.data?.message || "Signup failed";
      return { success: false, message };
    }
  };

  const loginUser = async (form) => {
    try {
      const data = await AuthAPI.login(form);
      if (data?.token && data?.user) setSession(data);
      return { success: true, data };
    } catch (err) {
      const message = err?.response?.data?.message || "Login failed";
      return { success: false, message };
    }
  };

  const logout = () => clearSession();

  const value = useMemo(() => ({ user, signupUser, loginUser, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
