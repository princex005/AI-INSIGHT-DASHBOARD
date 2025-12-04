import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Technology from './components/Technology';
import BlogSection from './components/BlogSection';
import BlogDetail from './components/BlogDetail';
import InsightStudio from './components/InsightStudio';
import Analytics from './components/Analytics';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
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
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;