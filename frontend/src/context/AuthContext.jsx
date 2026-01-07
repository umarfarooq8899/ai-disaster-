// src/context/AuthContext.jsx
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
    if (user) {
      localStorage.setItem("adr_user", JSON.stringify(user));
      localStorage.setItem("adr_token", user.token); // store token
    } else {
      localStorage.removeItem("adr_user");
      localStorage.removeItem("adr_token");
    }
  }, [user]);

  const setSession = (payload) => {
    localStorage.setItem("adr_token", payload.token);
    setUser(payload.user);
  };

  const clearSession = () => {
    localStorage.removeItem("adr_token");
    localStorage.removeItem("adr_user");
    setUser(null);
  };

  const signupUser = async (form) => {
    try {
      const data = await AuthAPI.signup(form);
      if (data.success) return { success: true, data };
      return { success: false, message: data.message || "Signup failed" };
    } catch (err) {
      const message = err?.response?.data?.message || "Signup failed";
      return { success: false, message };
    }
  };

  const loginUser = async (form) => {
    try {
      const data = await AuthAPI.login(form);

      if (data?.token && data?.user) {
        setSession(data);
        return { success: true, data };
      }

      return { success: false, message: data?.message || "Invalid login" };
    } catch (err) {
      const message = err?.response?.data?.message || "Login failed";
      return { success: false, message };
    }
  };

  const updateUser = (newData) => setUser((prev) => ({ ...prev, ...newData }));
  const logout = () => clearSession();

  const value = useMemo(
    () => ({ user, signupUser, loginUser, logout, updateUser }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
