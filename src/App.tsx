import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import ContactPage from "./pages/contact";
import AboutPage from "./pages/about";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import ProtectedRoute from "./pages/auth/ProtectedRoute.tsx";
import RedirectIfLoggedIn from "./pages/auth/RedirectIfLoggedIn";

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Technology from './components/Technology';
import BlogSection from './components/BlogSection';
import BlogDetail from './components/BlogDetail';
import InsightStudio from './components/InsightStudio';
import Analytics from './components/Analytics';
import Footer from './components/Footer';

import AdminDashboard from "./admin/AdminDashboard";

function TrackPageVisit() {
  const location = useLocation();

  useEffect(() => {
    const logVisit = async () => {
      await supabase.from("user_analytics").insert([
        {
          user_id: "guest",
          page_visited: location.pathname,
          event_type: "visit",
          event_detail: "",
          device: navigator.userAgent
        }
      ]);
    };
    logVisit();
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <TrackPageVisit />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />

        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={
            <>
              <Hero />
              <Technology />
              <BlogSection />
            </>
          } />

          {/* Public Pages */}
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />

          {/* Auth Pages — Wrapped with RedirectIfLoggedIn */}
          <Route
            path="/signup"
            element={
              <RedirectIfLoggedIn>
                <Signup />
              </RedirectIfLoggedIn>
            }
          />

          <Route
            path="/login"
            element={
              <RedirectIfLoggedIn>
                <Login />
              </RedirectIfLoggedIn>
            }
          />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <InsightStudio />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
