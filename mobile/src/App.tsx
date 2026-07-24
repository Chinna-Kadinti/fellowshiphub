import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  AuthProvider,
  RedirectIfAuthenticated,
  RequireAuth,
  useAuth
} from "./auth/AuthProvider";
import { AppShell } from "./components/AppShell";
import { InstallAppPrompt } from "./components/InstallAppPrompt";
import {
  AnnouncementsPage,
  DirectoryPage,
  DiscussionsPage,
  PrayerPage,
  ReadingPage,
  ReportsPage,
  ResourcesPage
} from "./features";
import { installNativeUrlHandler } from "./lib/native";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MeetingDetailPage } from "./pages/MeetingDetailPage";
import { MeetingsPage } from "./pages/MeetingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function RequireAdmin() {
  const { user } = useAuth();
  return user?.role === "ADMIN" ? <Outlet /> : <Navigate replace to="/dashboard" />;
}

function NavigationEffects() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(
    () => installNativeUrlHandler((path) => navigate(path)),
    [navigate]
  );

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationEffects />
      <InstallAppPrompt />
      <Routes>
        <Route element={<Navigate replace to="/dashboard" />} path="/" />
        <Route
          element={
            <RedirectIfAuthenticated>
              <AuthPage mode="login" />
            </RedirectIfAuthenticated>
          }
          path="/login"
        />
        <Route
          element={
            <RedirectIfAuthenticated>
              <AuthPage mode="register" />
            </RedirectIfAuthenticated>
          }
          path="/register"
        />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route element={<DashboardPage />} path="/dashboard" />
            <Route element={<MeetingsPage />} path="/meetings" />
            <Route element={<MeetingDetailPage />} path="/meetings/:id" />
            <Route element={<AnnouncementsPage />} path="/announcements" />
            <Route element={<ResourcesPage />} path="/resources" />
            <Route element={<PrayerPage />} path="/prayer" />
            <Route element={<DiscussionsPage />} path="/discussions" />
            <Route element={<ReadingPage />} path="/reading" />
            <Route element={<DirectoryPage />} path="/directory" />
            <Route element={<RequireAdmin />}>
              <Route element={<ReportsPage />} path="/reports" />
            </Route>
            <Route element={<NotFoundPage />} path="*" />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
