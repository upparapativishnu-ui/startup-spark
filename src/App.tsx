import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import StartupDashboard from "./pages/StartupDashboard.tsx";
import Discover from "./pages/Discover.tsx";
import Messages from "./pages/Messages.tsx";
import RoleGate from "./pages/RoleGate.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminLogs from "./pages/admin/AdminLogs.tsx";
import AdminContent from "./pages/admin/AdminContent.tsx";
import { SeoManager } from "./components/SeoManager.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SeoManager />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/app" element={<ProtectedRoute><RoleGate /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><StartupDashboard /></ProtectedRoute>} />
            <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
            <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
