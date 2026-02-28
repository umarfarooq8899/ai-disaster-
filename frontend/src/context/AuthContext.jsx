import React, { createContext, useEffect, useMemo, useState } from "react";
import * as AuthAPI from "../api/auth";
import * as VolunteerAPI from "../api/volunteer";

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
    if (user && token) {
      localStorage.setItem("adr_user", JSON.stringify(user));
      localStorage.setItem("adr_token", token);
    } else {
      localStorage.removeItem("adr_user");
      localStorage.removeItem("adr_token");
    }
    setLoading(false);
  }, [user, token]);

  // ================= Helpers =================
  const setSession = ({ token: newToken, user: newUser }) => {
    setToken(newToken);
    setUser(newUser);
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
      const data = await AuthAPI.signup(form); // /auth/register

      if (data?.token && data?.user) {
        setSession({ token: data.token, user: data.user });
        return { success: true, data };
      }

      return { success: false, message: data?.message || "Signup failed" };
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
        setSession({ token: data.token, user: data.user });
        return { success: true, data };
      }

      return { success: false, message: data?.message || "Invalid credentials" };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = () => clearSession();

  const updateUser = (newData) => setUser((prev) => ({ ...prev, ...newData }));

  // ================= Volunteer Profile =================
  const createVolunteerProfile = async (form) => {
    if (!token) return { success: false, message: "User not logged in" };

    try {
      const res = await VolunteerAPI.createVolunteerProfile(form); // /volunteer/create

      if (res?.success) {
        updateUser({ ...res.volunteer, profileCompleted: true });
        return { success: true, data: res.volunteer };
      }

      return { success: false, message: res?.message || "Failed to create volunteer profile" };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Failed to create volunteer profile",
      };
    }
  };

  // ================= Dashboard Routing =================
  const getDashboardPath = (role) => {
    const map = {
      admin: "/dashboard/admin",
      general: "/dashboard/user",
      volunteer: "/dashboard/volunteer",
      rescue_coordinator: "/dashboard/rescue",
      ngo_coordinator: "/dashboard/ngo",
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
      createVolunteerProfile,
      getDashboardPath,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
