import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "@/contexts/SessionProvider";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import AccountsPage from "@/pages/Accounts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/accounts" element={<AccountsPage />} />
            </Route>

            {/* AÑADE TODAS LAS RUTAS PERSONALIZADAS ENCIMA DE LA RUTA CATCH-ALL "*" */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;