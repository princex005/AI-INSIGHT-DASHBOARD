import { useState } from 'react';
import { Menu, X, Sparkles, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Product', href: '#product' },
    { label: 'Blog', href: '#blog' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav className=" w-full top-0 z-50">
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10 backdrop-saturate-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Insightiqo</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-slate-300 hover:text-white transition-colors duration-300 text-sm font-medium"
                >
                  {item.label}
                </a>
              ))}
            </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-slate-900/40 px-3 py-1 text-xs text-slate-300 hover:text-white hover:border-emerald-400/70 hover:bg-slate-900/70 transition-colors"
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Admin</span>
            </Link>
            <Link
              to="/app"
              className="relative group px-6 py-2 font-semibold overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-300 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden backdrop-blur-sm bg-white/5 border-t border-white/10 py-4 space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/analytics"
                className="block w-full px-4 py-2 mt-2 text-sm rounded-lg border border-white/15 text-slate-200 text-center hover:bg-white/5"
              >
                Admin
              </Link>
              <Link
                to="/app"
                className="block w-full px-4 py-2 mt-2 font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const ArrowRight = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);