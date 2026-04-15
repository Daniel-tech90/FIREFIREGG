import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FiX, FiUpload } from "react-icons/fi";
import API from "../api/axios";

const UPI_ID = "9508012773@upi";
const PRESETS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100, 150, 200, 500, 1000];

export default function AddMoneyModal({ onClose, userId, userName, userEmail, onSubmitted }) {
  const [step, setStep]           = useState(1);
  const [amount, setAmount]       = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const fileRef                   = useRef();

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Screenshot must be under 5MB");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScreenshot(ev.target.result);
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (!amount || Number(amount) < 5) return toast.error("Minimum amount is ₹5");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!screenshot) return toast.error("Please upload payment screenshot");
    setLoading(true);
    try {
      await API.post("/deposits/submit", {
        userId, userName, userEmail,
        amount: Number(amount),
        screenshotUrl: screenshot,
      });
      toast.success("Deposit request submitted! Waiting for admin approval. 🕐");
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "rgba(10,10,20,0.98)", border: "1px solid rgba(6,182,212,0.2)", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 z-10"
          style={{ background: "rgba(10,10,20,0.98)" }}>
          <div>
            <h3 className="text-white font-black text-base">Add Money via UPI</h3>
            <p className="text-slate-500 text-xs">Step {step} of 2 — {step === 1 ? "Enter amount & pay" : "Upload payment proof"}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><FiX size={18} /></button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* STEP 1 — Amount + UPI details */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">

                {/* Amount */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Amount (₹)</label>
                  <input
                    type="number" placeholder="Enter amount" value={amount}
                    onChange={e => setAmount(e.target.value)} autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-2xl font-black outline-none focus:border-cyan-400 transition-all placeholder:text-white/20"
                    style={{ colorScheme: "dark" }}
                  />
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {PRESETS.map(p => (
                      <button key={p} onClick={() => setAmount(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex-shrink-0 ${Number(amount) === p ? "bg-cyan-400/20 border-cyan-400/40 text-cyan-400" : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"}`}>
                        ₹{p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QR Code */}
                <div className="rounded-xl border border-white/10 p-4 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Scan QR Code</p>
                  {/* Static UPI QR */}
                  <div className="mx-auto rounded-2xl overflow-hidden" style={{ width: 260, height: 260 }}>
                    <img
                      src="/upi-qr.png"
                      alt="UPI QR Code"
                      style={{ width: "100%", height: "100%", objectFit: "contain", background: "white" }}
                    />
                  </div>

                  {/* Name + Verified */}
                  <div className="mt-3 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-black text-base tracking-wide">Dinesh Kumar Sah</p>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="12" fill="#22c55e"/>
                        <path d="M6.5 12.5L10 16L17.5 8.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      <p className="text-green-400 text-xs font-semibold">Verified UPI Account</p>
                    </div>
                  </div>

                  <p className="text-slate-500 text-xs mt-3">Open any UPI app → Scan → Pay ₹{amount || "0"}</p>
                  <a
                    href="/upi-qr.png"
                    download="FireFireGG-UPI-QR.png"
                    className="inline-flex items-center gap-1.5 mt-2 px-4 py-1.5 rounded-lg text-xs font-bold border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all"
                  >
                    ⬇ Download QR Code
                  </a>
                </div>

                {/* Instructions */}
                <div className="rounded-xl border border-yellow-500/20 p-4 space-y-1.5" style={{ background: "rgba(234,179,8,0.05)" }}>
                  <p className="text-yellow-400 text-xs font-black uppercase tracking-wider mb-2">⚠️ Instructions</p>
                  {["Open GPay / PhonePe / Paytm", "Pay to UPI ID or scan QR above", "Take a screenshot of success screen", "Come back and upload screenshot in next step"].map((s, i) => (
                    <p key={i} className="text-slate-300 text-xs flex items-start gap-2">
                      <span className="text-cyan-400 font-black flex-shrink-0">{i + 1}.</span> {s}
                    </p>
                  ))}
                </div>

                <button onClick={handleNext}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#06b6d4,#a855f7)" }}>
                  I've Paid ₹{amount ? Number(amount).toLocaleString() : "0"} → Upload Proof
                </button>
              </motion.div>
            )}

            {/* STEP 2 — Upload screenshot */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">

                {/* Summary */}
                <div className="rounded-xl border border-cyan-500/20 px-4 py-3 flex items-center justify-between"
                  style={{ background: "rgba(6,182,212,0.06)" }}>
                  <span className="text-slate-400 text-sm">Amount to add</span>
                  <span className="text-white font-black text-xl">₹{Number(amount).toLocaleString()}</span>
                </div>

                {/* Upload area */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Payment Screenshot *</label>
                  <div
                    onClick={() => fileRef.current.click()}
                    className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${preview ? "border-green-500/40 bg-green-500/5" : "border-white/10 hover:border-cyan-400/40 hover:bg-cyan-400/5"}`}
                  >
                    {preview ? (
                      <div className="space-y-2">
                        <img src={preview} alt="screenshot" className="max-h-48 mx-auto rounded-lg object-contain" />
                        <p className="text-green-400 text-xs font-bold">✅ Screenshot uploaded</p>
                        <p className="text-slate-500 text-xs">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FiUpload className="text-slate-500 text-3xl mx-auto" />
                        <p className="text-slate-300 text-sm font-bold">Click to upload screenshot</p>
                        <p className="text-slate-500 text-xs">JPG, PNG — Max 5MB</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>

                {/* Pending notice */}
                <div className="rounded-xl border border-yellow-500/20 p-3" style={{ background: "rgba(234,179,8,0.05)" }}>
                  <p className="text-yellow-400 text-xs font-bold">🕐 After submitting:</p>
                  <p className="text-slate-400 text-xs mt-1">Your request will be reviewed by admin. Balance will be added only after approval. This usually takes a few minutes.</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white font-bold text-sm transition-all">
                    ← Back
                  </button>
                  <button onClick={handleSubmit} disabled={loading || !screenshot}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#06b6d4,#a855f7)" }}>
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                      : "Submit for Approval"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
