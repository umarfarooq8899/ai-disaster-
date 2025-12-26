import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

// Public pages
import Home from "../pages/components/Home";
import Login from "../pages/components/Login";
import Signup from "../pages/components/Signup";
import ReportDisaster from "../pages/components/ReportDisaster";
import Alerts from "../pages/components/Alerts";
import Statistics from "../pages/components/Statistics";
import AIPredictions from "../pages/components/AIPredictions";
import Coordination from "../pages/components/Coordination";
import ForgotPassword from "../pages/components/ForgotPassword";
import ResetPassword from "../pages/components/ResetPassword";
import Profile from "../pages/user/Profile";

// Admin pages
import AdminHome from "../pages/admin/AdminHome";
import ManageUsers from "../pages/admin/ManageUsers";
import ManageDisasters from "../pages/admin/ManageDisasters";
import ManageAlerts from "../pages/admin/ManageAlerts";

// User pages
import UserHome from "../pages/user/UserHome";
import MyReports from "../pages/user/MyReports";
import SafeZones from "../pages/user/SafeZones";

// Volunteer pages
import VolunteerHome from "../pages/volunteer/VolunteerHome";
import Tasks from "../pages/volunteer/Tasks";
import NearbyReports from "../pages/volunteer/NearbyReports";

// NGO pages
import NGOHome from "../pages/ngo/NGOHome";
import ManageVolunteers from "../pages/ngo/ManageVolunteers";

// Rescue pages
import RescueHome from "../pages/rescue/RescueHome";

import { AuthContext } from "../context/AuthContext";

export default function Router() {
  const { user } = useContext(AuthContext);

  const PrivateRoute = ({ children, roles }) => {
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
    return children;
  };

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="report" element={<ReportDisaster />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="ai-predictions" element={<AIPredictions />} />
        <Route path="coordination" element={<Coordination />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* DASHBOARD — ALL PROTECTED ROUTES */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
 

        
        {/* USER ROUTES */}
        <Route path="user" element={<UserHome />} />
        <Route path="user/reports" element={<MyReports />} />
        <Route path="user/safe-zones" element={<SafeZones />} />

        {/* VOLUNTEER ROUTES */}
        <Route
          path="volunteer"
          element={
            <PrivateRoute roles={["volunteer"]}>
              <VolunteerHome />
            </PrivateRoute>
          }
        />
        <Route
          path="volunteer/tasks"
          element={
            <PrivateRoute roles={["volunteer"]}>
              <Tasks />
            </PrivateRoute>
          }
        />
        <Route
          path="volunteer/nearby"
          element={
            <PrivateRoute roles={["volunteer"]}>
              <NearbyReports />
            </PrivateRoute>
          }
        />

        {/* NGO ROUTES */}
        <Route
          path="ngo"
          element={
            <PrivateRoute roles={["ngo"]}>
              <NGOHome />
            </PrivateRoute>
          }
        />
        <Route
          path="ngo/volunteers"
          element={
            <PrivateRoute roles={["ngo"]}>
              <ManageVolunteers />
            </PrivateRoute>
          }
        />

        {/* RESCUE ROUTES */}
        <Route
          path="rescue"
          element={
            <PrivateRoute roles={["rescue"]}>
              <RescueHome />
            </PrivateRoute>
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="admin"
          element={
            <PrivateRoute roles={["admin"]}>
              <AdminHome />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <PrivateRoute roles={["admin"]}>
              <ManageUsers />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/disasters"
          element={
            <PrivateRoute roles={["admin"]}>
              <ManageDisasters />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/alerts"
          element={
            <PrivateRoute roles={["admin"]}>
              <ManageAlerts />
            </PrivateRoute>
          }
        />
      </Route>

      {/* CATCH ALL */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
