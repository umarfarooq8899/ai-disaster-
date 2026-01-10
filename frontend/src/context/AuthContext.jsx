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
  const [token, setToken] = useState(() => localStorage.getItem("adr_token"));
  const [loading, setLoading] = useState(true);

  // ================= Sync state with localStorage =================
  useEffect(() => {
    if (user && user.token) {
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

  // ================= Helpers =================
  const setSession = ({ token, user }) => {
    setUser({ ...user, token });
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("adr_user");
    localStorage.removeItem("adr_token");
  };

  // ================= AUTH ACTIONS =================
  const signupUser = async (form) => {
    try {
      // Ensure required fields for volunteer/rescue coordinator
      if (
        (form.role === "volunteer" || form.role === "rescue_coordinator") &&
        (!form.phone || !form.address)
      ) {
        return {
          success: false,
          message: "Phone number and address are required for this role.",
        };
      }

      const data = await AuthAPI.signup(form); // calls /auth/register

      if (data?.token && data?.user) {
        // Auto-set session
        setSession(data);
        return { success: true, data };
      }

      return {
        success: false,
        message: data?.message || "Signup failed",
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Signup failed",
      };
    }
  };

  const loginUser = async (form) => {
    try {
      const data = await AuthAPI.login(form);

      if (data?.token && data?.user) {
        setSession(data);
        return { success: true, data };
      }

      return {
        success: false,
        message: data?.message || "Invalid credentials",
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = () => clearSession();

  const updateUser = (newData) =>
    setUser((prev) => ({ ...prev, ...newData }));

  // ================= Dashboard Routing =================
  const getDashboardPath = (role) => {
    const map = {
      admin: "/dashboard/admin",
      general: "/dashboard/user",
      volunteer: "/dashboard/volunteer",
      rescue_coordinator: "/dashboard/rescue",
    };
    return map[role] || "/";
  };

  // ================= Context Value =================
  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      signupUser,
      loginUser,
      logout,
      updateUser,
      getDashboardPath,
    }),
    [user, token, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
