import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import DashboardLayout from "../layouts/DashboardLayout";

// Public pages
import Home from "../pages/public/Home";
import Login from "../pages/public/Login";
import Signup from "../pages/public/Signup";
import ReportDisaster from "../pages/public/ReportDisaster";
import Alerts from "../pages/public/Alerts";
import Statistics from "../pages/public/Statistics";
import AIPredictions from "../pages/public/AIPredictions";
import Coordination from "../pages/public/Coordination";




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

// Rescue & Admin
import RescueHome from "../pages/rescue/RescueHome";
import AdminHome from "../pages/admin/AdminHome";

import { AuthContext } from "../context/AuthContext";

export default function Router() {
  const { user } = useContext(AuthContext);

  // PROTECTED ROUTE WRAPPER
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

     


      </Route>

      {/* DASHBOARD — PROTECTED */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        {/* USER */}
        <Route path="user" element={<UserHome />} />
        <Route path="user/reports" element={<MyReports />} />
        <Route path="user/safe-zones" element={<SafeZones />} />

        {/* VOLUNTEER */}
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

        {/* NGO */}
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

        {/* RESCUE */}
        <Route
          path="rescue"
          element={
            <PrivateRoute roles={["rescue"]}>
              <RescueHome />
            </PrivateRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="admin"
          element={
            <PrivateRoute roles={["admin"]}>
              <AdminHome />
            </PrivateRoute>
          }
        />
      </Route>

      {/* CATCH ALL */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

