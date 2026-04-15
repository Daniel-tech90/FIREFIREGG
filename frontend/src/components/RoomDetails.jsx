import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCopy, FiCheck } from "react-icons/fi";

export default function RoomDetails({ tournament, isLive, isJoined }) {
  const [copied, setCopied] = useState(false);
  const { roomId, roomPassword } = tournament;
  if (!roomId && !roomPassword) return null;

  // Don't render anything if no room info at all
  if (!roomId && roomPassword === null) return null;

  return (
    <div className="rounded-xl border border-cyan-500/20 overflow-hidden" style={{ background: "rgba(6,182,212,0.05)" }}>
      <div className="px-3 py-2 border-b border-cyan-500/10">
        <p className="text-xs font-black uppercase tracking-wider text-cyan-400">🎮 Room Details</p>
      </div>
      <div className="px-3 py-2.5 space-y-2">

        {/* Room ID — always visible to joined users */}
        {roomId && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">Room ID</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-sm tracking-widest">{roomId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`p-1 rounded-lg transition-all ${
                  copied ? "text-green-400" : "text-slate-500 hover:text-white"
                }`}>
                {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
              </button>
            </div>
          </div>
        )}

        {/* Password — locked until live, only show if roomPassword field exists */}
        {(roomPassword !== undefined) && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">Password</span>
            <AnimatePresence mode="wait">
              {isLive && roomPassword ? (
                <motion.span
                  key="revealed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="font-black text-sm tracking-widest"
                  style={{ color: "#4ade80", textShadow: "0 0 12px rgba(74,222,128,0.8)" }}
                >
                  {roomPassword}
                </motion.span>
              ) : (
                <motion.span
                  key="locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-xs text-slate-500 font-bold"
                >
                  🔒 Hidden Until Match Time
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Non-joined users */}
        {!isJoined && (
          <p className="text-slate-600 text-xs text-center pt-1">Register to access Room Details</p>
        )}
      </div>
    </div>
  );
}
