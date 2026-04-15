import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiPhone, FiUser,
  FiShield, FiAlertTriangle, FiArrowLeft, FiCheck, FiZap
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";

const TABS = ["User Login", "Register"];

const countryCodes = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
];

const regions = ["India", "South Asia", "Southeast Asia", "Middle East", "Europe", "Americas"];

function Input({ icon: Icon, type = "text", placeholder, value, onChange, right }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input-field ${Icon ? "pl-9" : "pl-4"} ${right ? "pr-10" : ""}`}
      />
      {right && <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
    </div>
  );
}

// ── User Login ────────────────────────────────────────────────────────────────
function UserLogin({ onForgot }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const nav = useNavigate();

  const googleLogin = useGoogleLogin({
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

  const submit = (e) => {
    e.preventDefault();
    if (!email || !pass) return toast.error("Fill all fields");
    setLoading(true);
    setTimeout(() => {
      loginUser({ email, name: "Player" });
      toast.success("Welcome back! 🎮");
      nav("/dashboard");
    }, 1500);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 gap-2 focus-within:border-cyan-400 focus-within:bg-cyan-400/5 transition-all">
          <FiMail className="text-slate-500 text-sm flex-shrink-0" />
          <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} className="flex-1 bg-transparent outline-none text-slate-200 text-sm placeholder:text-white/30 h-11" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 gap-2 focus-within:border-cyan-400 focus-within:bg-cyan-400/5 transition-all">
          <FiLock className="text-slate-500 text-sm flex-shrink-0" />
          <input type={show ? "text" : "password"} placeholder="Enter password" value={pass} onChange={e => setPass(e.target.value)} className="flex-1 bg-transparent outline-none text-slate-200 text-sm placeholder:text-white/30 h-11" />
          <button type="button" onClick={() => setShow(!show)} className="text-slate-500 hover:text-cyan-400 flex-shrink-0">
            {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={() => setRemember(!remember)} className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${remember ? "bg-cyan-400 border-cyan-400" : "border-white/20 bg-white/5"}`}>
            {remember && <FiCheck className="text-black text-xs" />}
          </div>
          <span className="text-slate-400 text-xs">Remember me</span>
        </label>
        <button type="button" onClick={onForgot} className="text-cyan-400 text-xs hover:underline">Forgot Password?</button>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
        {loading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Logging in...</span> : <span>Login to Account</span>}
      </button>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-slate-500 text-xs">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <button type="button" onClick={() => googleLogin()} className="w-full glass border border-white/10 rounded-xl py-3 flex items-center justify-center gap-3 text-sm font-medium text-slate-300 hover:border-white/20 hover:bg-white/5 transition-all">
        <FcGoogle className="text-xl" /> Continue with Google
      </button>
    </form>
  );
}

// ── Register ──────────────────────────────────────────────────────────────────
function Register() {
  const [form, setForm] = useState({ name: "", username: "", email: "", phone: "", pass: "", confirm: "", uid: "", region: "", referral: "" });
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uidFetched, setUidFetched] = useState(false);
  const [fetchingUid, setFetchingUid] = useState(false);
  const nav = useNavigate();
  const { loginUser } = useAuth();

  const googleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        loginUser({ name: profile.name, email: profile.email, avatar: profile.picture });
        toast.success(`Account created! Welcome, ${profile.name}! 🚀`);
        nav("/dashboard");
      } catch {
        toast.error("Google signup failed. Try again.");
      }
    },
    onError: () => toast.error("Google signup failed. Try again."),
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const fetchUID = () => {
    if (!form.uid) return toast.error("Enter your Free Fire UID");
    setFetchingUid(true);
    setTimeout(() => { setFetchingUid(false); setUidFetched(true); }, 1500);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!terms) return toast.error("Accept terms to continue");
    if (form.pass !== form.confirm) return toast.error("Passwords don't match");
    setLoading(true);
    setTimeout(() => {
      loginUser({ name: form.name, email: form.email });
      toast.success("Account created! Welcome 🎮");
      nav("/dashboard");
    }, 1800);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
          <Input icon={FiUser} placeholder="Your name" value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
          <Input icon={FiUser} placeholder="@username" value={form.username} onChange={set("username")} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
        <Input icon={FiMail} type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} />
      </div>

      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
        <Input icon={FiPhone} placeholder="Phone number" value={form.phone} onChange={set("phone")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
          <Input
            icon={FiLock}
            type={show ? "text" : "password"}
            placeholder="Password"
            value={form.pass}
            onChange={set("pass")}
            right={
              <button type="button" onClick={() => setShow(!show)} className="text-slate-500 hover:text-cyan-400">
                {show ? <FiEyeOff /> : <FiEye />}
              </button>
            }
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Confirm</label>
          <Input icon={FiLock} type="password" placeholder="Confirm" value={form.confirm} onChange={set("confirm")} />
        </div>
      </div>

      {/* UID */}
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Free Fire UID</label>
        <div className="flex gap-2">
          <Input placeholder="Enter your UID" value={form.uid} onChange={set("uid")} />
          <button
            type="button"
            onClick={fetchUID}
            className="btn-secondary px-4 py-2 rounded-lg text-xs font-bold flex-shrink-0 whitespace-nowrap"
          >
            {fetchingUid ? <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /> : "Fetch"}
          </button>
        </div>
      </div>

      {/* UID Card */}
      <AnimatePresence>
        {uidFetched && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl p-4 border border-cyan-400/20 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
              FF
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">ProPlayer_FF</p>
              <p className="text-slate-400 text-xs">Level 72 • India • Heroic</p>
            </div>
            <FiCheck className="text-green-400 text-xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Region</label>
          <select value={form.region} onChange={set("region")} className="input-field">
            <option value="" style={{ background: "#0a0a0f" }}>Select region</option>
            {regions.map(r => <option key={r} value={r} style={{ background: "#0a0a0f" }}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Referral (optional)</label>
          <Input placeholder="Referral code" value={form.referral} onChange={set("referral")} />
        </div>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <div
          onClick={() => setTerms(!terms)}
          className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${terms ? "bg-cyan-400 border-cyan-400" : "border-white/20 bg-white/5"}`}
        >
          {terms && <FiCheck className="text-black text-xs" />}
        </div>
        <span className="text-slate-400 text-xs leading-relaxed">
          I agree to the <Link to="#" className="text-cyan-400 hover:underline">Terms of Service</Link> and <Link to="#" className="text-cyan-400 hover:underline">Privacy Policy</Link>
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
      >
        {loading
          ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account...</span>
          : <span>Create Account 🚀</span>}
      </button>

      <button type="button" onClick={() => googleSignup()} className="w-full glass border border-white/10 rounded-xl py-3 flex items-center justify-center gap-3 text-sm font-medium text-slate-300 hover:border-white/20 hover:bg-white/5 transition-all">
        <FcGoogle className="text-xl" /> Sign up with Google
      </button>
    </form>
  );
}

// ── Admin Login ───────────────────────────────────────────────────────────────
function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [twofa, setTwofa] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const nav = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (!email || !pass) return toast.error("Fill all fields");
    setLoading(true);
    setTimeout(() => {
      loginAdmin({ email, role: "admin" });
      toast.success("Admin access granted ✅");
      nav("/admin/dashboard");
    }, 1800);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Warning */}
      <div className="flex items-center gap-3 glass rounded-xl p-4 border border-red-500/30 bg-red-500/5">
        <FiAlertTriangle className="text-red-400 text-xl flex-shrink-0" />
        <div>
          <p className="text-red-400 font-bold text-sm">Authorized Access Only</p>
          <p className="text-slate-400 text-xs">Unauthorized access attempts are logged and reported.</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Admin Email</label>
        <Input icon={FiMail} type="email" placeholder="admin@firefiregg.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Admin Password</label>
        <Input
          icon={FiLock}
          type={show ? "text" : "password"}
          placeholder="Enter admin password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          right={
            <button type="button" onClick={() => setShow(!show)} className="text-slate-500 hover:text-red-400 transition-colors">
              {show ? <FiEyeOff /> : <FiEye />}
            </button>
          }
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">2FA Code</label>
        <Input icon={FiShield} placeholder="6-digit authenticator code" value={twofa} onChange={e => setTwofa(e.target.value)} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white transition-all"
      >
        {loading
          ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</span>
          : <span className="flex items-center gap-2"><FiShield /> Secure Admin Login</span>}
      </button>
    </form>
  );
}

// ── Forgot Password ───────────────────────────────────────────────────────────
function ForgotPassword({ onBack }) {
  const [step, setStep] = useState(1);
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOtp = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const next = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(s => s + 1); }, 1200);
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm transition-colors">
        <FiArrowLeft /> Back to Login
      </button>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-2">
        {["Contact", "Verify OTP", "New Password"].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step > i + 1 ? "bg-green-400 text-black" : step === i + 1 ? "bg-cyan-400 text-black" : "bg-white/10 text-slate-500"}`}>
              {step > i + 1 ? <FiCheck /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${step === i + 1 ? "text-cyan-400" : "text-slate-500"}`}>{s}</span>
            {i < 2 && <div className={`flex-1 h-px ${step > i + 1 ? "bg-cyan-400" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Enter your phone or email to receive a reset code.</p>
          <Input icon={FiPhone} placeholder="Phone or Email" value={contact} onChange={e => setContact(e.target.value)} />
          <button onClick={next} disabled={!contact || loading} className="btn-primary w-full py-3 rounded-xl font-bold text-sm">
            <span>{loading ? "Sending..." : "Send OTP"}</span>
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Enter the 6-digit code sent to <span className="text-cyan-400">{contact}</span></p>
          <div className="flex gap-2 justify-center">
            {otp.map((v, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                maxLength={1}
                value={v}
                onChange={e => handleOtp(i, e.target.value)}
                className="w-11 h-12 text-center text-white font-black text-lg bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none focus:bg-cyan-400/5 transition-all"
              />
            ))}
          </div>
          <button onClick={next} disabled={otp.join("").length < 6 || loading} className="btn-primary w-full py-3 rounded-xl font-bold text-sm">
            <span>{loading ? "Verifying..." : "Verify OTP"}</span>
          </button>
          <p className="text-center text-slate-500 text-xs">Didn't receive? <button className="text-cyan-400 hover:underline">Resend</button></p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Set your new password.</p>
          <Input icon={FiLock} type="password" placeholder="New password" value={newPass} onChange={e => setNewPass(e.target.value)} />
          <Input icon={FiLock} type="password" placeholder="Confirm new password" />
          <button
            onClick={() => { setLoading(true); setTimeout(() => { toast.success("Password reset! Please login."); onBack(); }, 1200); }}
            disabled={!newPass || loading}
            className="btn-primary w-full py-3 rounded-xl font-bold text-sm"
          >
            <span>{loading ? "Resetting..." : "Reset Password"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Auth Page ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState(0);
  const [forgot, setForgot] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-20 px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700" />
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(0,212,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(168,85,247,0.15) 0%, transparent 50%)" }}
      />
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center animate-pulse-glow">
              <FiZap className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-wider gradient-text">FREEFIRE<span className="text-white">GG</span></span>
          </Link>
          <p className="text-slate-500 text-sm mt-2">The #1 Free Fire Tournament Platform</p>
        </div>

        <div className="glass-dark rounded-3xl p-6 sm:p-8 border border-white/8">
          {forgot ? (
            <ForgotPassword onBack={() => setForgot(false)} />
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-1 glass rounded-xl p-1 mb-6">
                {TABS.map((t, i) => (
                  <button
                    key={t}
                    onClick={() => setTab(i)}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                      tab === i
                        ? i === 2
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === 0 && <UserLogin onForgot={() => setForgot(true)} />}
                  {tab === 1 && <Register />}
                </motion.div>
              </AnimatePresence>

              {/* Footer hint */}
              <p className="text-center text-slate-500 text-xs mt-5">
                {tab === 0 && <>No account? <button onClick={() => setTab(1)} className="text-cyan-400 hover:underline">Register free</button></>}
                {tab === 1 && <>Already have an account? <button onClick={() => setTab(0)} className="text-cyan-400 hover:underline">Login</button></>}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
