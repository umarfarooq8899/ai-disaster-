import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  const adminStr = localStorage.getItem("admin");
  const admin = adminStr ? JSON.parse(adminStr) : null;

  if (!token || !admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
