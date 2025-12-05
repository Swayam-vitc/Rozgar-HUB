import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import Landing from "./pages/Landing";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import RoleSelection from "./pages/auth/RoleSelection";
import WorkerOnboarding from "./pages/onboarding/WorkerOnboarding";
import EmployerOnboarding from "./pages/onboarding/EmployerOnboarding";
import WorkerDashboard from "./pages/worker/Dashboard";
import WorkerJobs from "./pages/worker/Jobs";
import WorkerWorkRequests from "./pages/worker/WorkRequests";
import WorkerMyApplications from "./pages/worker/MyApplications";
import WorkerCalendar from "./pages/worker/Calendar";
import WorkerTeam from "./pages/worker/Team";
import WorkerMessages from "./pages/worker/Messages";
import WorkerWallet from "./pages/worker/Wallet";
import WorkerProfile from "./pages/worker/Profile";
import WorkerHelp from "./pages/worker/Help";
import EmployerDashboard from "./pages/employer/Dashboard";
import EmployerPostJob from "./pages/employer/PostJob";
import EmployerProjects from "./pages/employer/Projects";
import EmployerViewProject from "./pages/employer/ViewProject";
import EmployerEditProject from "./pages/employer/EditProject";
import EmployerWorkers from "./pages/employer/Workers";
import EmployerWorkerProfile from "./pages/employer/WorkerProfile";
import EmployerApplications from "./pages/employer/Applications";
import EmployerPayments from "./pages/employer/Payments";
import EmployerMessages from "./pages/employer/Messages";
import EmployerProfile from "./pages/employer/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { SocketProvider } from "./contexts/SocketContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <SocketProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/role" element={<RoleSelection />} />

              {/* Direct access routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Onboarding Routes */}
              <Route path="/onboarding/worker" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerOnboarding />
                </ProtectedRoute>
              } />
              <Route path="/onboarding/employer" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerOnboarding />
                </ProtectedRoute>
              } />

              {/* Protected Worker Routes */}
              <Route path="/worker/dashboard" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/worker/jobs" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerJobs />
                </ProtectedRoute>
              } />
              <Route path="/worker/work-requests" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerWorkRequests />
                </ProtectedRoute>
              } />
              <Route path="/worker/applications" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerMyApplications />
                </ProtectedRoute>
              } />
              <Route path="/worker/calendar" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerCalendar />
                </ProtectedRoute>
              } />
              <Route path="/worker/team" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerTeam />
                </ProtectedRoute>
              } />
              <Route path="/worker/messages" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerMessages />
                </ProtectedRoute>
              } />
              <Route path="/worker/wallet" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerWallet />
                </ProtectedRoute>
              } />
              <Route path="/worker/profile" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerProfile />
                </ProtectedRoute>
              } />
              <Route path="/worker/help" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerHelp />
                </ProtectedRoute>
              } />

              {/* Protected Employer Routes */}
              <Route path="/employer/dashboard" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/employer/post-job" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerPostJob />
                </ProtectedRoute>
              } />
              <Route path="/employer/projects" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerProjects />
                </ProtectedRoute>
              } />
              <Route path="/employer/projects/:id" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerViewProject />
                </ProtectedRoute>
              } />
              <Route path="/employer/projects/:id/edit" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerEditProject />
                </ProtectedRoute>
              } />
              <Route path="/employer/workers" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerWorkers />
                </ProtectedRoute>
              } />
              <Route path="/employer/worker/:id" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerWorkerProfile />
                </ProtectedRoute>
              } />
              <Route path="/employer/applications" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerApplications />
                </ProtectedRoute>
              } />
              <Route path="/employer/payments" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerPayments />
                </ProtectedRoute>
              } />
              <Route path="/employer/messages" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerMessages />
                </ProtectedRoute>
              } />
              <Route path="/employer/profile" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerProfile />
                </ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SocketProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

export default App;
