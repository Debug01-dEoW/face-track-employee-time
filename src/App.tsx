
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import MainLayout from "./components/Layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/CheckIn";
import Attendance from "./pages/Attendance";
import Employees from "./pages/Employees";
import Profile from "./pages/Profile";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import PunchAttendance from "./pages/PunchAttendance";
import ManualAttendance from "./pages/ManualAttendance";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="facetrack-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/punch-attendance" element={<PunchAttendance />} />
              
              {/* Protected routes inside MainLayout */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/check-in" element={<CheckIn />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/manual-attendance" element={<ManualAttendance />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
