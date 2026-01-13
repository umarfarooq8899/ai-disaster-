import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Layouts
import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageUsers from "../pages/admin/ManageUsers";
import ManageDisasters from "../pages/admin/ManageDisasters";
import ManageAlerts from "../pages/admin/ManageAlerts";

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

// User pages
import UserHome from "../pages/user/UserHome";
import MyReports from "../pages/user/Reports";
import SafeZones from "../pages/user/SafeZones";

// Volunteer pages
import VolunteerHome from "../pages/volunteer/VolunteerHome";
import Tasks from "../pages/volunteer/Tasks";
import NearbyReports from "../pages/volunteer/NearbyReports";
import CreateVolunteer from "../pages/volunteer/CreateVolunteer";

// NGO pages
import NGOHome from "../pages/ngo/NGOHome";
import ManageVolunteers from "../pages/ngo/ManageVolunteers";

// Rescue pages
import RescueHome from "../pages/rescue/RescueHome";
import RescueDashboard from "../pages/rescue/RescueDashboard";
import Missions from "../pages/rescue/Missions";
import MissionForm from "../pages/rescue/MissionForm";

export default function Router() {
  const { user, loading } = useContext(AuthContext);

  // PrivateRoute for role-based access
  const PrivateRoute = ({ children, roles }) => {
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <Routes>
      {/* ================= PUBLIC ROUTES ================= */}
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

      {/* ================= DASHBOARD ROUTES ================= */}
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        {/* ===== Admin ===== */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/users" element={<ManageUsers />} />
        <Route path="admin/disasters" element={<ManageDisasters />} />
        <Route path="admin/alerts" element={<ManageAlerts />} />
        <Route path="admin/statistics" element={<Statistics />} />

        {/* ===== User ===== */}
        <Route path="user" element={<UserHome />} />
        <Route path="user/reports" element={<MyReports />} />
        <Route path="user/safe-zones" element={<SafeZones />} />

        {/* ===== Volunteer ===== */}
        <Route path="volunteer" element={<VolunteerHome />} />
        <Route path="volunteer/create-profile" element={
          <PrivateRoute roles={["volunteer"]}>
            <CreateVolunteer />
          </PrivateRoute>
        } />
        <Route path="volunteer/tasks" element={<Tasks />} />
        <Route path="volunteer/nearby" element={<NearbyReports />} />

        {/* ===== NGO ===== */}
        <Route path="ngo" element={<NGOHome />} />
        <Route path="ngo/volunteers" element={<ManageVolunteers />} />

        {/* ===== Rescue ===== */}
        <Route path="rescue" element={<RescueHome />} />
        <Route path="rescue/dashboard" element={<RescueDashboard />} />
        <Route path="rescue/missions" element={<Missions />} />
        <Route path="rescue/missions/new" element={<MissionForm />} />

        {/* Catch-all inside dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* ================= PUBLIC CATCH-ALL ================= */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
