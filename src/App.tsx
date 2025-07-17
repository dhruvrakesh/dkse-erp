import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ItemMaster from "./pages/ItemMaster";
import StockOperations from "./pages/StockOperations";
import OpeningStock from "./pages/OpeningStock";
import StockSummary from "./pages/StockSummary";
import StockAnalytics from "./pages/StockAnalytics";
import OpeningStockSummary from "./pages/OpeningStockSummary";
import Categories from "./pages/Categories";
import StockAlerts from "./pages/StockAlerts";
import LegacyData from "./pages/LegacyData";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProtectedRoute>
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <main className="flex-1">
                  <header className="h-12 flex items-center border-b px-4">
                    <SidebarTrigger />
                    <h2 className="ml-4 font-semibold">ERP Management System</h2>
                  </header>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/items" element={<ItemMaster />} />
                    <Route path="/stock" element={<StockOperations />} />
                    <Route path="/stock-summary" element={<StockSummary />} />
                    <Route path="/stock-analytics" element={<StockAnalytics />} />
                    <Route path="/opening-stock" element={<OpeningStock />} />
                    <Route path="/opening-stock-summary" element={<OpeningStockSummary />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/stock-alerts" element={<StockAlerts />} />
                    <Route path="/legacy" element={<LegacyData />} />
                    <Route path="/settings" element={<Settings />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </SidebarProvider>
          </ProtectedRoute>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
