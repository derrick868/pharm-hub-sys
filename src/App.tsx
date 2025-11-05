import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Inventory from "./pages/Inventory";
import POS from "./pages/POS";
import Suppliers from "./pages/Suppliers";
import Reports from "./pages/Reports";
import Sales from "./pages/Sales";
import DoctorAssessment from "./pages/DoctorAssessment";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<ProtectedRoute><DashboardLayout><Home /></DashboardLayout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><DashboardLayout><Inventory /></DashboardLayout></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute><DashboardLayout><POS /></DashboardLayout></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><DashboardLayout><Suppliers /></DashboardLayout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><DashboardLayout><Sales /></DashboardLayout></ProtectedRoute>} />
          <Route path="/assessment" element={<ProtectedRoute><DashboardLayout><DoctorAssessment /></DashboardLayout></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
