import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiAlertTriangle, FiZap } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "admin@firefiregg.com";
const ADMIN_PASS = "FireFireGG@Admin2025";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const nav = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (!email || !pass) return toast.error("Fill all fields");
    setLoading(true);
    setTimeout(() => {
      if (email !== ADMIN_EMAIL || pass !== ADMIN_PASS) {
        setLoading(false);
        return toast.error("Invalid admin credentials ❌");
      }
      loginAdmin({ email, role: "admin" });
      toast.success("Admin access granted ✅");
      nav("/admin/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: "#050508" }}>
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(255,59,59,0.2) 0%, transparent 60%)" }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-3">
            <FiZap className="text-white text-2xl" />
          </div>
          <h1 className="text-white font-black text-2xl">Admin Portal</h1>
          <p className="text-slate-500 text-xs mt-1">FireFireGG — Restricted Access</p>
        </div>

        <div className="rounded-2xl p-6 border border-red-500/20"
          style={{ background: "rgba(10,5,5,0.97)" }}>

          <div className="flex items-center gap-3 rounded-xl p-3 border border-red-500/20 bg-red-500/5 mb-5">
            <FiAlertTriangle className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-xs font-bold">Authorized Access Only</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Admin Email</label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 gap-2 focus-within:border-red-400 transition-all">
                <FiMail className="text-slate-500 text-sm flex-shrink-0" />
                <input type="email" placeholder="admin@firefiregg.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-slate-200 text-sm placeholder:text-white/30 h-11" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 gap-2 focus-within:border-red-400 transition-all">
                <FiLock className="text-slate-500 text-sm flex-shrink-0" />
                <input type={show ? "text" : "password"} placeholder="Enter password" value={pass}
                  onChange={e => setPass(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-slate-200 text-sm placeholder:text-white/30 h-11" />
                <button type="button" onClick={() => setShow(!show)} className="text-slate-500 hover:text-red-400">
                  {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}>
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                : <><FiShield /> Secure Admin Login</>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
