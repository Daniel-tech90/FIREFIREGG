import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FiDollarSign, FiArrowUpRight, FiArrowDownLeft, FiPlus, FiClock, FiX } from "react-icons/fi";
import AddMoneyModal from "../components/AddMoneyModal";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function WalletPage() {
  const { user } = useAuth();
  const [showModal, setShowModal]     = useState(false);
  const [wallet, setWallet]           = useState(null);
  const [deposits, setDeposits]       = useState([]);
  const [loadingW, setLoadingW]       = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!user?._id) return;
    try {
      const { data } = await API.get(`/wallet/${user._id}`);
      setWallet(data);
    } catch { } finally { setLoadingW(false); }
  }, [user?._id]);

  const fetchDeposits = useCallback(async () => {
    if (!user?._id) return;
    try {
      const { data } = await API.get(`/deposits/user/${user._id}`);
      setDeposits(data);
    } catch { }
  }, [user?._id]);

  useEffect(() => { fetchWallet(); fetchDeposits(); }, [fetchWallet, fetchDeposits]);

  const balance   = wallet?.balance ?? 0;
  const txns      = wallet?.transactions ?? [];
  const totalIn   = txns.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalOut  = txns.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const pendingDep = deposits.find(d => d.status === "pending");

  return (
    <>
      <main className="min-h-screen pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-black text-white mb-6">My Wallet</h1>

          {/* Pending deposit banner */}
          <AnimatePresence>
            {pendingDep && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-4 rounded-xl border border-yellow-500/30 px-4 py-3 flex items-center gap-3"
                style={{ background: "rgba(234,179,8,0.07)" }}>
                <FiClock className="text-yellow-400 flex-shrink-0" size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-yellow-400 text-sm font-bold">Payment submitted. Waiting for admin verification.</p>
                  <p className="text-slate-400 text-xs mt-0.5">₹{Number(pendingDep.amount).toLocaleString()} · Submitted {new Date(pendingDep.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Balance Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-dark-600" />
            <div className="absolute inset-0 glass" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Balance</p>
                  {loadingW
                    ? <div className="w-32 h-10 rounded-xl skeleton mb-1" />
                    : <p className="text-white font-black text-4xl sm:text-5xl">₹{balance.toLocaleString()}</p>}
                  <p className="text-slate-500 text-xs mt-2">Last updated: Just now</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (pendingDep) return toast.error("You have a pending deposit. Wait for admin approval.");
                      setShowModal(true);
                    }}
                    className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    <FiPlus /> Add Money
                  </button>
                  <button
                    onClick={() => toast("⏳ Withdraw coming soon!", { icon: "🚧" })}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-not-allowed opacity-50 border border-white/10 text-slate-400"
                  >
                    <FiArrowUpRight /> Withdraw <span className="text-xs font-normal">(Coming Soon)</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Added",  value: `₹${totalIn.toLocaleString()}`,  icon: FiArrowDownLeft, color: "text-green-400" },
              { label: "Total Spent",  value: `₹${totalOut.toLocaleString()}`, icon: FiArrowUpRight,  color: "text-red-400"   },
              { label: "Total Won",    value: "₹0",                            icon: FiDollarSign,    color: "text-yellow-400"},
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-4 border border-white/5 text-center">
                <s.icon className={`${s.color} text-xl mx-auto mb-1`} />
                <p className="text-white font-black">{s.value}</p>
                <p className="text-slate-500 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Deposit Requests */}
          {deposits.length > 0 && (
            <div className="glass rounded-2xl border border-white/5 overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="text-white font-bold text-sm">Deposit Requests</h2>
              </div>
              <div className="divide-y divide-white/5">
                {deposits.map((d, i) => (
                  <motion.div key={d._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 px-5 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
                      d.status === "approved" ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : d.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    }`}>
                      {d.status === "approved" ? "✓" : d.status === "rejected" ? "✗" : "⏳"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold">₹{Number(d.amount).toLocaleString()} deposit</p>
                      <p className="text-slate-500 text-xs">{new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      d.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : d.status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    }`}>{d.status}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-white font-bold">Transaction History</h2>
            </div>
            <div className="divide-y divide-white/5">
              {txns.length === 0 ? (
                <div className="py-12 text-center">
                  <FiDollarSign className="text-slate-700 text-4xl mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-bold">No transactions yet</p>
                  <p className="text-slate-600 text-xs mt-1">Add money to get started</p>
                </div>
              ) : [...txns].reverse().map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === "credit" ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                    {t.type === "credit"
                      ? <FiArrowDownLeft className="text-green-400 text-sm" />
                      : <FiArrowUpRight className="text-red-400 text-sm" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{t.label}</p>
                    <p className="text-slate-500 text-xs">{new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <p className={`font-black text-sm flex-shrink-0 ${t.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                    {t.type === "credit" ? "+" : "-"}₹{Number(t.amount).toLocaleString()}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showModal && (
          <AddMoneyModal
            onClose={() => setShowModal(false)}
            userId={user?._id}
            userName={user?.name}
            userEmail={user?.email}
            onSubmitted={() => { fetchWallet(); fetchDeposits(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
