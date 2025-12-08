import { useState, useEffect } from 'react';
import { Menu, X, Sparkles, Activity, ArrowRight, LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Product', href: '#product' },
    { label: 'Blog', href: '#blog' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  // ✅ Check login status on every route change
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  }, [location.pathname]);

  // ✅ ALSO listen for login/logout events (from other components)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("authToken");
      setIsLoggedIn(!!token);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 🔥 SIGN OUT
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <nav className="w-full top-0 z-50">
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Main Nav */}
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Insightiqo
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">

              <Link
                to="/analytics"
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-slate-900/40 px-3 py-1 text-xs text-slate-300 hover:text-white hover:border-emerald-400/70 hover:bg-slate-900/70 transition-colors"
              >
                <Activity className="w-3 h-3 text-emerald-400" />
                Admin
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    to="/app"
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                  >
                    Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 text-sm transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/signup"
                  className="group relative px-6 py-2 font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg hover:shadow-xl flex items-center gap-2 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}

            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-300 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white/5 border-t border-white/10 py-4 space-y-3 backdrop-blur-lg">

              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                to="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full px-4 py-2 text-sm text-center rounded-lg border border-white/15 text-slate-200 hover:bg-white/5"
              >
                Admin
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    to="/app"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-2 rounded-lg bg-white/10 text-center"
                  >
                    Dashboard
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 text-sm"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-center"
                >
                  Get Started
                </Link>
              )}

            </div>
          )}

        </div>
      </div>
    </nav>
  );
}
