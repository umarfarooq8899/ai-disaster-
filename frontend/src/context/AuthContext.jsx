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
  const [token, setToken] = useState(() => localStorage.getItem("adr_token") || null);
  const [loading, setLoading] = useState(true);

  // Sync user & token to localStorage
  useEffect(() => {
    if (user?.token) {
      localStorage.setItem("adr_user", JSON.stringify(user));
      localStorage.setItem("adr_token", user.token);
      setToken(user.token);
    } else {
      localStorage.removeItem("adr_user");
      localStorage.removeItem("adr_token");
      setToken(null);
    }
    setLoading(false);
  }, [user]);

  const setSession = (payload) => {
    setUser({ ...payload.user, token: payload.token });
    setToken(payload.token);
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("adr_user");
    localStorage.removeItem("adr_token");
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

  // Map roles to dashboard paths
  const getDashboardPath = (role) => {
    const map = {
      admin: "/dashboard/admin",
      general: "/dashboard/user",
      volunteer: "/dashboard/volunteer",
      ngo: "/dashboard/ngo",
      rescue: "/dashboard/rescue",
    };
    return map[role] || "/";
  };

  const value = useMemo(
    () => ({ user, token, loading, signupUser, loginUser, logout, updateUser, getDashboardPath }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
