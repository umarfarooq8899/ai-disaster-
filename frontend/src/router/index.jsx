import React, { useContext, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Layouts
const PublicLayout = lazy(() => import("../layouts/PublicLayout"));
const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));

// Admin pages
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const ManageUsers = lazy(() => import("../pages/admin/ManageUsers"));
const ManageDisasters = lazy(() => import("../pages/admin/ManageDisasters"));
const ManageAlerts = lazy(() => import("../pages/admin/ManageAlerts"));
const ManageOrganizations = lazy(() => import("../pages/admin/ManageOrganizations"));

// Public pages
const Home = lazy(() => import("../pages/components/Home"));
const Login = lazy(() => import("../pages/components/Login"));
const Signup = lazy(() => import("../pages/components/Signup"));
const ReportDisaster = lazy(() => import("../pages/components/ReportDisaster"));
const Alerts = lazy(() => import("../pages/components/Alerts"));
const Statistics = lazy(() => import("../pages/components/Statistics"));
const AIPredictions = lazy(() => import("../pages/components/AIPredictions"));
const Coordination = lazy(() => import("../pages/components/Coordination"));
const ForgotPassword = lazy(() => import("../pages/components/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/components/ResetPassword"));
const Profile = lazy(() => import("../pages/user/Profile"));

// User pages
const UserHome = lazy(() => import("../pages/user/UserHome"));
const MyReports = lazy(() => import("../pages/user/Reports"));
const SafeZones = lazy(() => import("../pages/user/SafeZones"));

// Volunteer pages
const VolunteerHome = lazy(() => import("../pages/volunteer/VolunteerHome"));
const Tasks = lazy(() => import("../pages/volunteer/Tasks"));
const NearbyReports = lazy(() => import("../pages/volunteer/NearbyReports"));
const CreateVolunteer = lazy(() => import("../pages/volunteer/CreateVolunteer"));

// NGO pages
const NGOHome = lazy(() => import("../pages/ngo/NGOHome"));
const ManageResources = lazy(() => import("../pages/ngo/ManageResources"));
const AidAssignments = lazy(() => import("../pages/ngo/AidAssignments"));
const AssignAid = lazy(() => import("../pages/ngo/AssignAid"));

// Rescue pages
const RescueHome = lazy(() => import("../pages/rescue/RescueHome"));
const RescueDashboard = lazy(() => import("../pages/rescue/RescueDashboard"));
const Missions = lazy(() => import("../pages/rescue/Missions"));
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

  return (
    <Suspense fallback={<LoadingPage />}>
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
          <Route path="admin/organizations" element={<ManageOrganizations />} />
          <Route path="admin/alerts" element={<ManageAlerts />} />
          <Route path="admin/statistics" element={<Statistics />} />

          {/* ===== User ===== */}
          <Route path="user" element={<UserHome />} />
          <Route path="user/reports" element={<MyReports />} />
          <Route path="user/safe-zones" element={<SafeZones />} />

          <Route path="volunteer" element={<VolunteerHome />} />
          <Route path="volunteer/create" element={<CreateVolunteer />} />
          <Route path="volunteer/tasks" element={<Tasks />} />
          <Route path="volunteer/nearby" element={<NearbyReports />} />
          {/* ===== NGO ===== */}
          <Route path="ngo" element={<NGOHome />} />
          <Route path="ngo/volunteers" element={<ManageVolunteers />} />
          <Route path="ngo/resources" element={<ManageResources />} />
          <Route path="ngo/assignments" element={<AidAssignments />} />
          <Route path="ngo/assignments/new" element={<AssignAid />} />

          {/* ===== Rescue ===== */}
          <Route path="rescue" element={<RescueHome />} />
          <Route path="rescue/dashboard" element={<RescueDashboard />} />
          <Route path="rescue/missions" element={<Missions />} />
          <Route path="rescue/missions/new" element={<MissionForm />} />
          <Route path="rescue/volunteers" element={<ManageVolunteers />} />

          {/* Catch-all inside dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* ================= PUBLIC CATCH-ALL ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
