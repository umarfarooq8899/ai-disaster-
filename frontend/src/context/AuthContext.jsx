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

  // Keep localStorage in sync
  useEffect(() => {
    if (user) {
      localStorage.setItem("adr_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("adr_user");
      localStorage.removeItem("adr_token");
    }
  }, [user]);

  // Set session after login
  const setSession = (payload) => {
    localStorage.setItem("adr_token", payload.token);
    setUser(payload.user);
  };

  // Clear session on logout
  const clearSession = () => {
    localStorage.removeItem("adr_token");
    localStorage.removeItem("adr_user");
    setUser(null);
  };

  // Signup: does NOT auto-login
  const signupUser = async (form) => {
    try {
      const data = await AuthAPI.signup(form);
      return { success: true, data };
    } catch (err) {
      const message = err?.response?.data?.message || "Signup failed";
      return { success: false, message };
    }
  };

  // Login: sets session
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

  // Update current user (used by Profile page)
  const updateUser = (newData) => {
    setUser((prev) => ({ ...prev, ...newData }));
  };

  const logout = () => clearSession();

  const value = useMemo(
    () => ({ user, signupUser, loginUser, logout, updateUser }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
