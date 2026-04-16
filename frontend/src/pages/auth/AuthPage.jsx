import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiZap, FiShield, FiAlertTriangle } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";

function GoogleButton({ label, onSuccess }) {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        onSuccess(profile);
      } catch {
        toast.error("Google login failed. Try again.");
      }
    },
    onError: () => toast.error("Google login failed. Try again."),
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      className="w-full glass border border-white/10 rounded-xl py-3.5 flex items-center justify-center gap-3 text-sm font-bold text-slate-200 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all"
    >
      <FcGoogle className="text-xl" /> {label}
    </button>
  );
}

export default function AuthPage() {
  const { loginUser, loginAdmin } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState(0); // 0=user, 1=admin
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAIL = "admin@firefiregg.com";
  const ADMIN_PASS = "FireFireGG@Admin2025";

  const handleUserGoogle = (profile) => {
    loginUser({ name: profile.name, email: profile.email, avatar: profile.picture });
    toast.success(`Welcome, ${profile.name}! 🎮`);
    nav("/dashboard");
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPass) return toast.error("Fill all fields");
    setLoading(true);
    setTimeout(() => {
      if (adminEmail !== ADMIN_EMAIL || adminPass !== ADMIN_PASS) {
        setLoading(false);
        return toast.error("Invalid admin credentials ❌");
      }
      loginAdmin({ email: adminEmail, role: "admin" });
      toast.success("Admin access granted ✅");
      nav("/admin/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden pt-24 pb-12 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700" />
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(0,212,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(168,85,247,0.15) 0%, transparent 50%)" }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-purple-600 blur-lg opacity-90" />
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-cyan-400/80" style={{ boxShadow: "0 0 28px rgba(0,212,255,0.9), 0 0 56px rgba(168,85,247,0.5)" }}>
                <img src="/logo.jpg" alt="logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-wider gradient-text">FREEFIRE<span className="text-white">GG</span></span>
          </Link>
          <p className="text-slate-500 text-sm mt-2">The #1 Free Fire Tournament Platform</p>
        </div>

        <div className="glass-dark rounded-3xl p-6 sm:p-8 border border-white/8">
          {/* Tabs */}
          <div className="flex gap-1 glass rounded-xl p-1 mb-6">
            {["Player Login", "Admin Login"].map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  tab === i
                    ? i === 1 ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}>
                {t}
              </button>
            ))}
          </div>

          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {tab === 0 ? (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-white font-bold text-base">Welcome Back! 🎮</p>
                  <p className="text-slate-400 text-xs mt-1">Sign in with your Google account to continue</p>
                </div>
                <GoogleButton label="Continue with Google" onSuccess={handleUserGoogle} />
                <p className="text-center text-slate-500 text-xs">
                  New player? <GoogleButton label="Sign up with Google" onSuccess={handleUserGoogle} />
                </p>
              </div>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="flex items-center gap-3 glass rounded-xl p-3 border border-red-500/20 bg-red-500/5">
                  <FiAlertTriangle className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs font-bold">Authorized Access Only</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Admin Email</label>
                  <input type="email" placeholder="admin@firefiregg.com" value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-3 text-slate-200 text-sm outline-none focus:border-red-400 transition-all placeholder:text-white/30" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <input type="password" placeholder="Enter admin password" value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-3 text-slate-200 text-sm outline-none focus:border-red-400 transition-all placeholder:text-white/30" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</> : <><FiShield /> Secure Admin Login</>}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
