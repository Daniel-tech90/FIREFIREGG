import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiZap } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";

export default function AuthPage() {
  const { loginUser, user } = useAuth();
  const nav = useNavigate();

  // Already logged in — go straight to dashboard
  useEffect(() => {
    if (user) nav("/dashboard", { replace: true });
  }, [user]);

  if (user) return null;

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        loginUser({ name: profile.name, email: profile.email, avatar: profile.picture });
        toast.success(`Welcome, ${profile.name}! 🎮`);
        nav("/dashboard");
      } catch {
        toast.error("Google login failed. Try again.");
      }
    },
    onError: () => toast.error("Google login failed. Try again."),
  });

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden pt-24 pb-12 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700" />
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(0,212,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(168,85,247,0.15) 0%, transparent 50%)" }}
      />

      <div className="relative w-full max-w-sm">
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

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-dark rounded-3xl p-8 border border-white/8">
          <div className="text-center mb-6">
            <p className="text-white font-bold text-lg">Welcome Back! 🎮</p>
            <p className="text-slate-400 text-sm mt-1">Sign in to access your account</p>
          </div>
          <button
            type="button"
            onClick={() => handleGoogle()}
            className="w-full glass border border-white/10 rounded-xl py-4 flex items-center justify-center gap-3 text-sm font-bold text-slate-200 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all"
          >
            <FcGoogle className="text-2xl" /> Continue with Google
          </button>
          <p className="text-center text-slate-500 text-xs mt-4">One click login • No password needed</p>
        </motion.div>
      </div>
    </div>
  );
}
