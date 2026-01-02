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

  const setSession = (payload) => {
    localStorage.setItem("adr_token", payload.token);
    setUser(payload.user);
  };

  const clearSession = () => {
    localStorage.removeItem("adr_token");
    localStorage.removeItem("adr_user");
    setUser(null);
  };

  // Signup Logic
  const signupUser = async (form) => {
    try {
      const data = await AuthAPI.signup(form);
      
      // FIX: Verify the success flag from the backend response
      if (data.success) {
        return { success: true, data };
      } else {
        return { success: false, message: data.message || "Signup failed" };
      }
    } catch (err) {
      const message = err?.response?.data?.message || "Signup failed";
      return { success: false, message };
    }
  };

  // Login Logic
  const loginUser = async (form) => {
    try {
      const data = await AuthAPI.login(form);
      
      // FIX: Ensure data is valid before setting session
      if (data?.token && data?.user) {
        setSession(data);
        return { success: true, data };
      } 
      
      return { success: false, message: data?.message || "Invalid response from server" };
    } catch (err) {
      // This catches 400, 401, and 500 errors from Axios
      const message = err?.response?.data?.message || "Login failed";
      return { success: false, message };
    }
  };

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