import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ContactPage from "./pages/contact";
import AboutPage from "./pages/about";

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Technology from './components/Technology';
import BlogSection from './components/BlogSection';
import BlogDetail from './components/BlogDetail';
import InsightStudio from './components/InsightStudio';
import Analytics from './components/Analytics';
import Footer from './components/Footer';
import Insights from './components/Insights.tsx';

// ⭐ NEW IMPORT: Admin Dashboard
import AdminDashboard from "./admin/AdminDashboard";

// ⭐ Track page visits on every route
function TrackPageVisit() {
  const location = useLocation(); // detects route change

  useEffect(() => {
    const logVisit = async () => {
      await supabase.from("user_analytics").insert([
        {
          user_id: "guest",
          page_visited: location.pathname,   // tracks current route
          event_type: "visit",
          event_detail: "",
          device: navigator.userAgent
        }
      ]);
    };

    logVisit();
  }, [location.pathname]); // runs every time the URL changes

  return null;
}

function App() {
  return (
    <Router>
      {/* Tracks visits for every page */}
      <TrackPageVisit />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <Navbar />

        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <Technology />
              <BlogSection />
            </>
          } />

          <Route path="/app" element={<InsightStudio />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />

          {/* ⭐ NEW ADMIN ROUTE */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/insights" element={<Insights/>} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
