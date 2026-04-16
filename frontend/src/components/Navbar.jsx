import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiZap } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const navLinks = [
  { label: "Home", to: "/", protected: false },
  { label: "Tournaments", to: "/tournaments", protected: true },
  { label: "Leaderboard", to: "/leaderboard", protected: true },
  { label: "How It Works", to: "/how-it-works", protected: true },
  { label: "Contact", to: "/contact", protected: true },
];

const HIDDEN_ROUTES = ["/dashboard", "/admin/dashboard", "/admin-secret-login"];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isHiddenRoute = HIDDEN_ROUTES.some(r => location.pathname.startsWith(r));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  const handleNavClick = (e, link) => {
    if (link.protected && !user) {
      e.preventDefault();
      toast.error("Please login to access this page 🔒");
      navigate("/auth");
    }
  };

  // Hide on dashboard routes OR when user is logged in (check both context and localStorage)
  const isLoggedIn = !!user || !!localStorage.getItem("ff_user");
  if (isHiddenRoute || isLoggedIn) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-dark shadow-lg" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center animate-pulse-glow">
            <FiZap className="text-white text-sm" />
          </div>
          <span className="text-xl font-black tracking-wider gradient-text">
            FREEFIRE<span className="text-white">GG</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <ul className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                onClick={(e) => handleNavClick(e, link)}
                className={`text-sm font-medium transition-all duration-200 hover:text-cyan-400 relative group ${
                  location.pathname === link.to ? "text-cyan-400" : "text-slate-300"
                }`}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 group-hover:w-full transition-all duration-300" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link to="/auth" className="btn-secondary text-sm px-4 py-2 rounded-lg">
            Login
          </Link>
          <Link
            to="/auth?tab=register"
            className="btn-primary text-sm px-4 py-2 rounded-lg"
          >
            <span>Register</span>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-slate-300 hover:text-cyan-400 transition-colors p-2"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden glass-dark border-t border-white/5"
          >
            <div className="px-4 py-5 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`flex items-center gap-3 text-sm font-medium py-3 px-4 rounded-xl transition-all ${
                    location.pathname === link.to
                      ? "text-cyan-400 bg-cyan-400/10 border border-cyan-400/20"
                      : "text-slate-300 hover:text-cyan-400 hover:bg-white/5"
                  }`}
                >
                  {link.label}
                  {link.protected && !user && <span className="ml-auto text-xs text-slate-600">🔒</span>}
                </Link>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-3 mt-1 border-t border-white/5">
                <Link to="/auth" className="btn-secondary text-sm text-center py-3 rounded-xl font-bold">
                  Login
                </Link>
                <Link to="/auth?tab=register" className="btn-primary text-sm text-center py-3 rounded-xl font-bold">
                  <span>Register</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
