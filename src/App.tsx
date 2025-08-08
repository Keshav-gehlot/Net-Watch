import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PacketsPage from "./pages/Packets";
import AlertsPage from "./pages/Alerts";
import UploadPage from "./pages/Upload";
import UrlCheckPage from "./pages/UrlCheck";
import { HelmetProvider } from "react-helmet-async";
import Spotlight from "@/components/visuals/Spotlight";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Spotlight />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/packets" element={<PacketsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/url-check" element={<UrlCheckPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
