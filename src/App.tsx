import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Ultrasound, { UltrasoundDetail } from "./pages/Ultrasound";
import UltrasoundAdmin from "./pages/UltrasoundAdmin";
import PTExercises from "./pages/PTExercises";
import PTLocations from "./pages/PTLocations";
import {
  ExerciseLibraryHome,
  RegionDetail,
  RegionGeneralDetail,
  RegionPathologyDetail,
  ExerciseSearch,
} from "./pages/ExerciseLibrary";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import ExerciseLibraryAdmin from "./pages/ExerciseLibraryAdmin";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/resources" element={<Navigate to="/services" replace />} />
            <Route path="/orthopedic-resources" element={<Navigate to="/services" replace />} />
            <Route path="/ultrasound" element={<Ultrasound />} />
            <Route path="/ultrasound/:slug" element={<UltrasoundDetail />} />
            <Route path="/ultrasound-admin" element={<UltrasoundAdmin />} />
            <Route path="/injuries" element={<Navigate to="/exercise-library" replace />} />
            <Route path="/injuries/:slug" element={<Navigate to="/exercise-library" replace />} />
            <Route path="/pt-exercises" element={<PTExercises />} />
            <Route path="/exercise-library" element={<ExerciseLibraryHome />} />
            <Route path="/exercise-library/search" element={<ExerciseSearch />} />
            <Route path="/exercise-library/region/:slug" element={<RegionDetail />} />
            <Route path="/exercise-library/region/:slug/general" element={<RegionGeneralDetail />} />
            <Route path="/exercise-library/region/:slug/pathology/:pathologySlug" element={<RegionPathologyDetail />} />
            <Route path="/pt-locations" element={<PTLocations />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/exercise-library-admin" element={<ExerciseLibraryAdmin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
