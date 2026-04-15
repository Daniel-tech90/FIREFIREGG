import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiClock, FiUsers, FiDollarSign, FiLock, FiShield, FiChevronLeft, FiCheck } from "react-icons/fi";
import { GiTrophy } from "react-icons/gi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Badge } from "../components/ui/index.jsx";

const participants = [
  { id: 1, name: "ProSniper_FF", uid: "123456789", avatar: "PS" },
  { id: 2, name: "GhostKiller99", uid: "987654321", avatar: "GK" },
  { id: 3, name: "NightHawk_X", uid: "456789123", avatar: "NH" },
  { id: 4, name: "StormBreaker", uid: "321654987", avatar: "SB" },
  { id: 5, name: "BlazeFire_01", uid: "654321789", avatar: "BF" },
  { id: 6, name: "ShadowWolf", uid: "789123456", avatar: "SW" },
];

const rules = [
  "Players must join the room 10 minutes before match time.",
  "Use of hacks, mods, or cheats results in permanent ban.",
  "Room ID and password will be shared 5 minutes before start.",
  "Results are based on in-game kill count and placement.",
  "Disputes must be raised within 30 minutes of match end.",
  "Prize will be credited to wallet within 24 hours.",
];

export default function TournamentDetails() {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const slotsTotal = 100;
  const slotsFilled = 88;
  const slotsPercent = (slotsFilled / slotsTotal) * 100;
  const matchStarted = false;

  const join = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setJoined(true);
      toast.success("Successfully joined! 🎮 Room details will be shared before match.");
    }, 1500);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        {/* Banner */}
        <div className="relative h-56 sm:h-72 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-dark-600 via-dark-700 to-dark-800" />
          <div className="absolute inset-0 opacity-40"
            style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(0,212,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(168,85,247,0.3) 0%, transparent 50%)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <GiTrophy className="text-7xl text-yellow-400 mx-auto mb-3" style={{ filter: "drop-shadow(0 0 30px rgba(250,204,21,0.6))" }} />
              <Badge color="red">🔴 LIVE</Badge>
            </div>
          </div>
          <Link to="/dashboard" className="absolute top-4 left-4 flex items-center gap-2 glass px-3 py-2 rounded-lg text-slate-300 hover:text-white text-sm transition-all">
            <FiChevronLeft /> Back
          </Link>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left */}
            <div className="lg:col-span-2 space-y-5">
              {/* Title */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Solo Blitz Championship</h1>
                  <Badge color="blue">Solo</Badge>
                </div>
                <p className="text-slate-400 text-sm">Free Fire • Organized by FireFireGG</p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Entry Fee", value: "₹25", icon: FiDollarSign, color: "text-cyan-400" },
                  { label: "Prize Pool", value: "₹5,000", icon: GiTrophy, color: "text-yellow-400" },
                  { label: "Date", value: "Today 8 PM", icon: FiClock, color: "text-purple-400" },
                  { label: "Players", value: `${slotsFilled}/${slotsTotal}`, icon: FiUsers, color: "text-green-400" },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-xl p-3 text-center border border-white/5">
                    <s.icon className={`${s.color} text-xl mx-auto mb-1`} />
                    <p className="text-white font-black">{s.value}</p>
                    <p className="text-slate-500 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Slots */}
              <div className="glass rounded-xl p-4 border border-white/5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Slots Filled</span>
                  <span className="text-white font-bold">{slotsFilled}/{slotsTotal}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${slotsPercent}%` }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                  />
                </div>
                <p className="text-red-400 text-xs mt-2">⚡ Only {slotsTotal - slotsFilled} slots remaining!</p>
              </div>

              {/* Rules */}
              <div className="glass rounded-xl p-5 border border-white/5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <FiShield className="text-cyan-400" /> Tournament Rules
                </h3>
                <ul className="space-y-2">
                  {rules.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-400 text-sm">
                      <span className="text-cyan-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Participants */}
              <div className="glass rounded-xl p-5 border border-white/5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <FiUsers className="text-purple-400" /> Participants ({slotsFilled})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {p.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">{p.name}</p>
                        <p className="text-slate-500 text-xs truncate">{p.uid}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Join Card */}
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 border border-cyan-500/20 sticky top-20">
                <h3 className="text-white font-bold mb-4">Join Tournament</h3>

                <div className="space-y-2 mb-5">
                  {[
                    { label: "Entry Fee", value: "₹25" },
                    { label: "Your Balance", value: "₹1,250" },
                    { label: "After Join", value: "₹1,225" },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between text-sm">
                      <span className="text-slate-400">{r.label}</span>
                      <span className="text-white font-bold">{r.value}</span>
                    </div>
                  ))}
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Prize Pool</span>
                    <span className="text-yellow-400 font-black">₹5,000</span>
                  </div>
                </div>

                {joined ? (
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
                      <FiCheck className="text-green-400 text-xl" />
                    </div>
                    <p className="text-green-400 font-bold">You're Registered!</p>

                    {/* Room Details */}
                    <div className="glass rounded-xl p-4 border border-white/10">
                      {matchStarted ? (
                        <div>
                          <p className="text-white font-bold text-sm mb-2">Room Details</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Room ID</span>
                              <span className="text-cyan-400 font-mono font-bold">FF2025001</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Password</span>
                              <span className="text-cyan-400 font-mono font-bold">FIRE25</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <FiLock className="text-yellow-400" />
                          <div>
                            <p className="text-xs font-medium text-white">Room details locked</p>
                            <p className="text-xs">Unlocks 5 min before start</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={join}
                    disabled={loading}
                    className="btn-primary w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Joining...</span>
                      : <span>Join Now — ₹25</span>}
                  </button>
                )}

                <p className="text-slate-500 text-xs text-center mt-3">Entry fee deducted from wallet</p>
              </div>

              {/* Prize Distribution */}
              <div className="glass rounded-xl p-4 border border-white/5">
                <h4 className="text-white font-bold text-sm mb-3">Prize Distribution</h4>
                <div className="space-y-2">
                  {[
                    { rank: "🥇 1st", prize: "₹2,500" },
                    { rank: "🥈 2nd", prize: "₹1,500" },
                    { rank: "🥉 3rd", prize: "₹1,000" },
                  ].map((p) => (
                    <div key={p.rank} className="flex justify-between text-sm">
                      <span className="text-slate-400">{p.rank}</span>
                      <span className="text-yellow-400 font-bold">{p.prize}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
