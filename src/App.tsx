import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Resources from "./pages/Resources";
import Ultrasound from "./pages/Ultrasound";
import PTExercises from "./pages/PTExercises";
import PTLocations from "./pages/PTLocations";
import {
  ExerciseLibraryHome,
  DiagnosisList,
  DiagnosisDetail,
  RegionList,
  RegionDetail,
  JointHealthList,
  JointHealthDetail,
  ExerciseSearch,
} from "./pages/ExerciseLibrary";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import ExerciseLibraryAdmin from "./pages/ExerciseLibraryAdmin";
import Injuries from "./pages/Injuries";
import InjuryDetail from "./pages/InjuryDetail";
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
            <Route path="/resources" element={<Resources />} />
            <Route path="/ultrasound" element={<Ultrasound />} />
            <Route path="/injuries" element={<Injuries />} />
            <Route path="/injuries/:slug" element={<InjuryDetail />} />
            <Route path="/pt-exercises" element={<PTExercises />} />
            <Route path="/exercise-library" element={<ExerciseLibraryHome />} />
            <Route path="/exercise-library/search" element={<ExerciseSearch />} />
            <Route path="/exercise-library/diagnosis" element={<DiagnosisList />} />
            <Route path="/exercise-library/diagnosis/:slug" element={<DiagnosisDetail />} />
            <Route path="/exercise-library/region" element={<RegionList />} />
            <Route path="/exercise-library/region/:slug" element={<RegionDetail />} />
            <Route path="/exercise-library/joint-health" element={<JointHealthList />} />
            <Route path="/exercise-library/joint-health/:slug" element={<JointHealthDetail />} />
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
