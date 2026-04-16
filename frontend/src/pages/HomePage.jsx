import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiZap, FiShield, FiTarget, FiTrendingUp, FiDollarSign,
  FiHeadphones, FiArrowRight, FiUsers, FiPlay,
  FiChevronRight, FiLock, FiX,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import { GiCrossedSwords, GiPodium } from "react-icons/gi";
import { SectionTitle } from "../components/ui/index.jsx";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// ─── Animated Counter ───────────────────────────────────────────────────────
function Counter({ end, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = end / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function HeroLoginCard() {
  const { loginUser, user } = useAuth();
  const navigate = useNavigate();

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        loginUser({ name: profile.name, email: profile.email, avatar: profile.picture });
        toast.success(`Welcome, ${profile.name}! 🎮`);
        navigate("/dashboard");
      } catch {
        toast.error("Google login failed. Try again.");
      }
    },
    onError: () => toast.error("Google login failed. Try again."),
  });

  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-0 rounded-3xl bg-cyan-400/10 blur-3xl animate-pulse" />
      <div className="relative glass-dark rounded-3xl p-7 border border-white/10">
        {user ? (
          <>
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl mx-auto mb-3">
                {user.name?.[0] || "P"}
              </div>
              <p className="text-white font-black text-base">Welcome back, {user.name?.split(" ")[0]}! 🎮</p>
              <p className="text-slate-400 text-xs mt-1">{user.email}</p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            >
              <span>Go to Dashboard →</span>
            </button>
          </>
        ) : (
          <>
            <h3 className="text-white font-black text-xl mb-1">Get Started</h3>
            <p className="text-slate-400 text-xs mb-6">Join 250,000+ players competing daily</p>
            <div className="space-y-3">
              <p className="text-slate-300 text-sm text-center">Sign in or create your account instantly</p>
              <button
                type="button"
                onClick={() => handleGoogle()}
                className="w-full glass border border-white/10 rounded-xl py-3.5 flex items-center justify-center gap-3 text-sm font-bold text-slate-200 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all"
              >
                <FcGoogle className="text-xl" /> Continue with Google
              </button>
              <p className="text-center text-slate-500 text-xs">One click login • No password needed</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ onClose }) {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Blurred backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          className="relative glass-dark border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <FiX size={18} />
          </button>

          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-purple-600/20 border border-cyan-400/30 flex items-center justify-center mb-4">
            <FiLock className="text-cyan-400" size={20} />
          </div>

          <h3 className="text-white font-black text-lg mb-1">Login Required</h3>
          <p className="text-slate-400 text-sm mb-6">Please login first to view matches and join tournaments.</p>

          <div className="flex gap-3">
            <button
              onClick={() => { onClose(); navigate("/auth"); }}
              className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-bold"
            >
              <span>Login</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────
function Hero() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleViewMatches = (e) => {
    if (!user) {
      e.preventDefault();
      setShowModal(true);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700" />
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(0,212,255,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(168,85,247,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 60% 80%, rgba(255,59,59,0.1) 0%, transparent 40%)`
        }}
      />
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-cyan-400/20 text-cyan-400 text-xs font-semibold mb-4 sm:mb-6 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Live Tournaments Active
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight text-white mb-4">
            Join{" "}
            <span className="gradient-text">Competitive</span>
            <br />
            Tournaments &{" "}
            <span className="gradient-text-fire">Win Big Instantly</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg">
            The ultimate Free Fire battleground for champions. Join thrilling tournaments, defeat real players, and win instant cash rewards sent directly to your UPI or bank account.
          </p>

          <div className="flex flex-wrap gap-3 mb-6 sm:mb-10">
            <Link to="/auth?tab=register" className="btn-primary px-5 sm:px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
              <span className="flex items-center gap-2">
                <FiPlay /> Play Now
              </span>
            </Link>
            <Link to="/tournaments" onClick={handleViewMatches} className="btn-secondary px-5 sm:px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
              View Matches <FiArrowRight />
            </Link>
          </div>

          {showModal && <AuthModal onClose={() => setShowModal(false)} />}

          {/* Mobile Login Card — shown only on mobile */}
          <div className="lg:hidden mb-6">
            <HeroLoginCard />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: "Players", value: 250000, suffix: "+", icon: FiUsers, color: "text-cyan-400" },
              { label: "Matches", value: 18500, suffix: "+", icon: GiCrossedSwords, color: "text-purple-400" },
              { label: "Paid Out", value: 5200000, suffix: "+", icon: null, color: "text-yellow-400", prefix: "₹" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-2 sm:p-3 text-center border border-white/5">
                {stat.icon
                  ? <stat.icon className={`${stat.color} text-lg sm:text-xl mx-auto mb-1`} />
                  : <span className={`${stat.color} text-lg sm:text-xl font-black block mb-1`}>₹</span>
                }
                <p className="text-white font-black text-sm sm:text-xl">
                  {stat.prefix || ""}<Counter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-slate-500 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — Inline Login Card — desktop only */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="hidden lg:flex items-center justify-center relative"
        >
          <HeroLoginCard />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
        <span className="text-slate-500 text-xs">Scroll Down</span>
        <div className="w-5 h-8 rounded-full border border-slate-600 flex items-start justify-center p-1">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
          />
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
const features = [
  { icon: FiZap, title: "Instant Join", desc: "Join any tournament in seconds. No waiting, no hassle.", color: "blue" },
  { icon: FiShield, title: "Secure Payments", desc: "Bank-grade encryption for all transactions.", color: "green" },
  { icon: FiTarget, title: "Fair Matches", desc: "Anti-cheat system ensures every match is fair.", color: "red" },
  { icon: FiTrendingUp, title: "Live Leaderboard", desc: "Real-time rankings updated after every match.", color: "purple" },
  { icon: FiDollarSign, title: "Fast Withdrawals", desc: "Collect your prize directly on the UPI.", color: "yellow" },
  { icon: FiHeadphones, title: "24/7 Support", desc: "Our team is always here to help you.", color: "blue" },
];

const colorMap = {
  blue: { bg: "from-cyan-500/10 to-transparent", border: "border-cyan-500/20", icon: "text-cyan-400", glow: "group-hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]" },
  green: { bg: "from-green-500/10 to-transparent", border: "border-green-500/20", icon: "text-green-400", glow: "group-hover:shadow-[0_0_30px_rgba(0,255,136,0.2)]" },
  red: { bg: "from-red-500/10 to-transparent", border: "border-red-500/20", icon: "text-red-400", glow: "group-hover:shadow-[0_0_30px_rgba(255,59,59,0.2)]" },
  purple: { bg: "from-purple-500/10 to-transparent", border: "border-purple-500/20", icon: "text-purple-400", glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]" },
  yellow: { bg: "from-yellow-500/10 to-transparent", border: "border-yellow-500/20", icon: "text-yellow-400", glow: "group-hover:shadow-[0_0_30px_rgba(250,204,21,0.2)]" },
};

function Features() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          tag="Why Choose Us"
          title="Everything You Need to Win"
          subtitle="Built for serious players who want a fair, fast, and rewarding tournament experience."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const c = colorMap[f.color];
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group glass rounded-2xl p-6 border ${c.border} bg-gradient-to-br ${c.bg} card-hover transition-all duration-300 ${c.glow}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
                  <f.icon className={`text-xl ${c.icon}`} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Top Winners ──────────────────────────────────────────────────────────────
const winners = [
  { rank: 1, name: "ProSniper_FF", wins: 142, earnings: 85000, avatar: "PS", badge: "🥇" },
  { rank: 2, name: "GhostKiller99", wins: 118, earnings: 62000, avatar: "GK", badge: "🥈" },
  { rank: 3, name: "NightHawk_X", wins: 97, earnings: 48000, avatar: "NH", badge: "🥉" },
  { rank: 4, name: "StormBreaker", wins: 84, earnings: 35000, avatar: "SB", badge: "4" },
  { rank: 5, name: "BlazeFire_01", wins: 76, earnings: 28000, avatar: "BF", badge: "5" },
];

function TopWinners() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          tag="Leaderboard"
          title="Top Winners This Month"
          subtitle="The best players competing and earning on our platform."
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {winners.map((w, i) => (
            <motion.div
              key={w.rank}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`glass rounded-xl px-5 py-4 border flex items-center gap-4 card-hover ${
                w.rank === 1 ? "border-yellow-500/30 bg-yellow-500/5" :
                w.rank === 2 ? "border-slate-400/30 bg-slate-400/5" :
                w.rank === 3 ? "border-orange-500/30 bg-orange-500/5" :
                "border-white/5"
              }`}
            >
              <div className="text-2xl w-8 text-center">{w.badge}</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {w.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{w.name}</p>
                <p className="text-slate-500 text-xs">{w.wins} wins</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-black">₹{w.earnings.toLocaleString()}</p>
                <p className="text-slate-500 text-xs">earned</p>
              </div>
              <GiPodium className={`text-xl flex-shrink-0 ${w.rank <= 3 ? "text-yellow-400" : "text-slate-600"}`} />
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/leaderboard" className="btn-secondary px-8 py-3 rounded-xl text-sm font-bold inline-flex items-center gap-2">
            Full Leaderboard <FiChevronRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <TopWinners />
    </main>
  );
}
