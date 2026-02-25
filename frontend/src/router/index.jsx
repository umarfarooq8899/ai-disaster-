import React, { useContext, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition";

// Layouts
const PublicLayout = lazy(() => import("../layouts/PublicLayout"));
const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));

// Admin pages
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminHome = lazy(() => import("../pages/admin/AdminHome"));
const ManageUsers = lazy(() => import("../pages/admin/ManageUsers"));
const ManageDisasters = lazy(() => import("../pages/admin/ManageDisasters"));
const ManageAlerts = lazy(() => import("../pages/admin/ManageAlerts"));
const ManageOrganizations = lazy(() => import("../pages/admin/ManageOrganizations"));
const AdminMissionHistory = lazy(() => import("../pages/admin/MissionHistory"));

// Public pages
const Home = lazy(() => import("../pages/components/Home"));
const Login = lazy(() => import("../pages/components/Login"));
const Signup = lazy(() => import("../pages/components/Signup"));
const ReportDisaster = lazy(() => import("../pages/components/ReportDisaster"));
const Alerts = lazy(() => import("../pages/components/Alerts"));
const Statistics = lazy(() => import("../pages/components/Statistics"));
const Coordination = lazy(() => import("../pages/components/Coordination"));
const ForgotPassword = lazy(() => import("../pages/components/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/components/ResetPassword"));
const Profile = lazy(() => import("../pages/user/Profile"));

// User pages
const UserHome = lazy(() => import("../pages/user/UserHome"));
const MyReports = lazy(() => import("../pages/user/Reports"));
const SafeZones = lazy(() => import("../pages/user/SafeZones"));
const AIDashboard = lazy(() => import("../pages/user/AIDashboard"));

// Volunteer pages
const VolunteerHome = lazy(() => import("../pages/volunteer/VolunteerHome"));
const Tasks = lazy(() => import("../pages/volunteer/Tasks"));
const NearbyReports = lazy(() => import("../pages/volunteer/NearbyReports"));
const VolunteerHistory = lazy(() => import("../pages/volunteer/VolunteerHistory"));
const CreateVolunteer = lazy(() => import("../pages/volunteer/CreateVolunteer"));


// NGO pages
const NGOHome = lazy(() => import("../pages/ngo/NGOHome"));
const ManageResources = lazy(() => import("../pages/ngo/ManageResources"));
const AidAssignments = lazy(() => import("../pages/ngo/AidAssignments"));
const AssignAid = lazy(() => import("../pages/ngo/AssignAid"));
const AidHistory = lazy(() => import("../pages/ngo/AidHistory"));

// Rescue pages
const RescueHome = lazy(() => import("../pages/rescue/RescueHome"));
const Missions = lazy(() => import("../pages/rescue/Missions"));
const MissionHistory = lazy(() => import("../pages/rescue/MissionHistory"));
const MissionForm = lazy(() => import("../pages/rescue/MissionForm"));
const ManageVolunteers = lazy(() => import("../pages/rescue/ManageVolunteers"));

const LoadingPage = () => (
  <div className="flex h-screen items-center justify-center bg-blue-white">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-600 border-t-transparent shadow-soft"></div>
      <p className="text-sm font-medium text-slate-600">Loading Disaster Relief System...</p>
    </div>
  </div>
);

export default function Router() {
  const { user, loading } = useContext(AuthContext);

  const PrivateRoute = ({ children, roles }) => {
    if (loading) return <LoadingPage />;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
  };

  const location = useLocation();

  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes location={location}>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<PageTransition><Home /></PageTransition>} />
          <Route path="login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="signup" element={<PageTransition><Signup /></PageTransition>} />
          <Route path="report" element={<PageTransition><ReportDisaster /></PageTransition>} />
          <Route path="alerts" element={<PageTransition><Alerts /></PageTransition>} />
          <Route path="statistics" element={<PageTransition><Statistics /></PageTransition>} />
          <Route path="coordination" element={<PageTransition><Coordination /></PageTransition>} />
          <Route path="forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
          <Route path="reset-password/:token" element={<PageTransition><ResetPassword /></PageTransition>} />
          <Route path="profile" element={<PageTransition><Profile /></PageTransition>} />
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
          <Route path="admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
          <Route path="admin/users" element={<PageTransition><ManageUsers /></PageTransition>} />
          <Route path="admin/disasters" element={<PageTransition><ManageDisasters /></PageTransition>} />
          <Route path="admin/organizations" element={<PageTransition><ManageOrganizations /></PageTransition>} />
          <Route path="admin/alerts" element={<PageTransition><ManageAlerts /></PageTransition>} />
          <Route path="admin/statistics" element={<PageTransition><Statistics /></PageTransition>} />
          <Route path="admin/mission-history" element={<PageTransition><AdminMissionHistory /></PageTransition>} />

          {/* ===== User ===== */}
          <Route path="user" element={<PageTransition><UserHome /></PageTransition>} />
          <Route path="user/reports" element={<PageTransition><MyReports /></PageTransition>} />
          <Route path="user/safe-zones" element={<PageTransition><SafeZones /></PageTransition>} />
          <Route path="user/ai-analysis" element={<PageTransition><AIDashboard /></PageTransition>} />

          <Route path="volunteer" element={<PageTransition><VolunteerHome /></PageTransition>} />
          <Route path="volunteer/create" element={<PageTransition><CreateVolunteer /></PageTransition>} />
          <Route path="volunteer/tasks" element={<PageTransition><Tasks /></PageTransition>} />
          <Route path="volunteer/history" element={<PageTransition><VolunteerHistory /></PageTransition>} />
          <Route path="volunteer/nearby" element={<PageTransition><NearbyReports /></PageTransition>} />
          {/* ===== NGO ===== */}
          <Route path="ngo" element={<PageTransition><NGOHome /></PageTransition>} />
          <Route path="ngo/volunteers" element={<PageTransition><ManageVolunteers /></PageTransition>} />
          <Route path="ngo/resources" element={<PageTransition><ManageResources /></PageTransition>} />
          <Route path="ngo/assignments" element={<PageTransition><AidAssignments /></PageTransition>} />
          <Route path="ngo/assignments/new" element={<PageTransition><AssignAid /></PageTransition>} />
          <Route path="ngo/history" element={<PageTransition><AidHistory /></PageTransition>} />

          {/* ===== Rescue ===== */}
          <Route path="rescue" element={<PageTransition><RescueHome /></PageTransition>} />
          <Route path="rescue/missions" element={<PageTransition><Missions /></PageTransition>} />
          <Route path="rescue/history" element={<PageTransition><MissionHistory /></PageTransition>} />
          <Route path="rescue/missions/new" element={<PageTransition><MissionForm /></PageTransition>} />
          <Route path="rescue/volunteers" element={<PageTransition><ManageVolunteers /></PageTransition>} />

          {/* Catch-all inside dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* ================= PUBLIC CATCH-ALL ================= */}
      </Routes>
    </Suspense>
  );
}
