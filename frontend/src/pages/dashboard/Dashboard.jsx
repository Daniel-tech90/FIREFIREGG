import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiHome, FiAward, FiDollarSign, FiPlay, FiClock,
  FiBell, FiUser, FiHelpCircle, FiLogOut, FiMenu,
  FiLock, FiTrendingUp, FiZap, FiSearch, FiX, FiCalendar,
  FiMail, FiShield, FiEdit2, FiCheck
} from "react-icons/fi";
import { GiTrophy } from "react-icons/gi";
import { FaWhatsapp } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useTournaments } from "../../context/TournamentContext";
import CountdownTimer from "../../components/CountdownTimer";
import PlayerLookup from "../../components/PlayerLookup";
import RoomDetails from "../../components/RoomDetails";
import API from "../../api/axios";
import { io } from "socket.io-client";

const navItems = [
  { icon: FiHome, label: "Dashboard", id: "dashboard" },
  { icon: FiAward, label: "My Tournaments", id: "tournaments" },
  { icon: FiDollarSign, label: "Wallet", id: "wallet" },
  { icon: FiPlay, label: "Join Match", id: "join" },
  { icon: FiClock, label: "Match History", id: "history" },
  { icon: FiBell, label: "Notifications", id: "notifications" },
  { icon: FiUser, label: "Profile", id: "profile" },
  { icon: FiHelpCircle, label: "Support", id: "support" },
];

const LOCKED = ["tournaments", "wallet", "join", "history", "notifications", "profile", "support"];

function MyTournaments({ tournaments, loading, onJoin, user }) {
  const [filter, setFilter] = useState("all");
  const [expiredIds, setExpiredIds] = useState(new Set());

  const markExpired = (id) => setExpiredIds(prev => new Set([...prev, id]));

  const getStatus = (t) => (t.status === "upcoming" && expiredIds.has(t._id)) ? "live" : t.status;

  const filtered = filter === "all" ? tournaments
    : tournaments.filter(t => getStatus(t) === filter);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-white font-black text-lg flex items-center gap-2">
            <GiTrophy className="text-yellow-400" /> My Tournaments
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Browse and join upcoming Free Fire tournaments</p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {["all", "upcoming", "live", "completed"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f ? "bg-cyan-400/20 text-cyan-400" : "text-slate-500 hover:text-white"
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading tournaments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <GiTrophy className="text-slate-700 text-5xl mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-bold">No tournaments found</p>
          <p className="text-slate-600 text-xs mt-1">Check back soon for new matches!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t, i) => {
            const status = getStatus(t);
            return (
            <motion.div key={t._id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl border border-white/5 overflow-hidden flex flex-col"
            >
              {/* Card top */}
              <div className="px-4 py-3 border-b border-white/5 flex items-start justify-between gap-2"
                style={{ background: "linear-gradient(135deg,rgba(6,182,212,0.07),rgba(168,85,247,0.07))" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm truncate">{t.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{t.matchType || t.mode}</span>
                    {t.map && t.map !== "—" && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">{t.map}</span>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 ${
                  status === "live" ? "bg-green-500/10 text-green-400 border-green-500/20 live-badge"
                  : status === "completed" ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                }`}>
                  {status === "live" ? "🔴 Live" : status === "completed" ? "✅ Completed" : "⏰ Soon"}
                </span>
              </div>

              {/* Card body */}
              <div className="p-4 flex-1 space-y-3">
                {/* Date & countdown */}
                <div className="flex items-center gap-2 text-xs">
                  <FiCalendar className="text-cyan-400 flex-shrink-0" size={13} />
                  <span className="text-slate-300">{t.date} · {fmt12(t.time)}</span>
                  <CountdownTimer date={t.date} time={t.time} onExpire={() => markExpired(t._id)} />
                </div>

                {/* Closing time countdown */}
                {t.closingTime && status !== "live" && status !== "completed" && (
                  new Date(`${t.date}T${t.closingTime}`).getTime() <= Date.now()
                    ? (
                      <div className="flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 border border-red-500/30" style={{ background: "rgba(239,68,68,0.08)" }}>
                        <FiClock className="text-red-400 flex-shrink-0" size={12} />
                        <span className="text-red-400 font-bold">Registration Closed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 border border-red-500/20" style={{ background: "rgba(239,68,68,0.06)" }}>
                        <FiClock className="text-red-400 flex-shrink-0" size={12} />
                        <span className="text-slate-400">Registration closes in:</span>
                        <CountdownTimer date={t.date} time={t.closingTime} />
                      </div>
                    )
                )}

                {/* Financials */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg p-2 text-center" style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.15)" }}>
                    <p className="text-cyan-400 font-black text-sm">₹{Number(t.entryFee || 0).toLocaleString()}</p>
                    <p className="text-slate-500 text-xs">Entry</p>
                  </div>
                  <div className="rounded-lg p-2 text-center" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.15)" }}>
                    <p className="text-yellow-400 font-black text-sm">₹{Number(t.prizeAmount || t.prizePool || 0).toLocaleString()}</p>
                    <p className="text-slate-500 text-xs">Prize</p>
                  </div>
                  <div className="rounded-lg p-2 text-center" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
                    <p className="text-green-400 font-black text-sm">{t.slotsLeft ?? t.totalSlots}</p>
                    <p className="text-slate-500 text-xs">Slots Left</p>
                  </div>
                </div>

                {/* Slot bar */}
                {(() => {
                  const total = t.totalSlots || t.maxSlots || 1;
                  const filled = total - (t.slotsLeft ?? 0);
                  const pct = Math.min((filled / total) * 100, 100);
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Slots filled</span>
                        <span className="font-bold" style={{ color: pct >= 90 ? "#f87171" : pct >= 60 ? "#facc15" : "#34d399" }}>
                          {filled}/{total}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5">
                        <div className="h-2 rounded-full transition-all" style={{
                          width: `${pct}%`,
                          background: pct >= 90
                            ? "linear-gradient(90deg,#ef4444,#f97316)"
                            : pct >= 60
                            ? "linear-gradient(90deg,#eab308,#f97316)"
                            : "linear-gradient(90deg,#06b6d4,#a855f7)"
                        }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Room Details */}
                <RoomDetails
                  tournament={t}
                  isLive={status === "live"}
                  isJoined={!!t.joinedPlayers?.find(p => p.id === user?._id)}
                />

                {/* Prize dist */}
                {(t.prize1st || t.prize2nd || t.prize3rd) && (
                  <div className="flex gap-1.5 flex-wrap">
                    {t.prize1st && <span className="text-xs px-2 py-0.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">🥇 ₹{Number(t.prize1st).toLocaleString()}</span>}
                    {t.prize2nd && <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-500/10 text-slate-300 border border-slate-500/20">🥈 ₹{Number(t.prize2nd).toLocaleString()}</span>}
                    {t.prize3rd && <span className="text-xs px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">🥉 ₹{Number(t.prize3rd).toLocaleString()}</span>}
                  </div>
                )}
              </div>

              {/* Join button */}
              {status !== "completed" && status !== "cancelled" && (
                <div className="px-4 pb-4">
                  <button
                    onClick={onJoin}
                    className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                    style={{ background: status === "live"
                      ? "linear-gradient(135deg,#22c55e,#16a34a)"
                      : "linear-gradient(135deg,#06b6d4,#a855f7)" }}>
                    {status === "live" ? "🔴 Join Now" : "⏰ Register"}
                  </button>
                </div>
              )}
            </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfilePage({ user, ffUid, ffName, uidServer, onChangeUID }) {
  const player = (() => { try { return JSON.parse(localStorage.getItem("ff_player_cache")); } catch { return null; } })();
  const statsCache = (() => { try { return JSON.parse(localStorage.getItem("ff_stats_cache")); } catch { return null; } })();
  const [tab, setTab] = useState("solo");
  const info   = player?.basicinfo;
  const clan   = player?.clanbasicinfo;
  const social = player?.socialinfo;
  const credit = player?.creditscoreinfo;
  const pet    = player?.petinfo;
  const lastSeen = (ts) => ts ? new Date(Number(ts) * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const cleanBio = (s) => s?.replace(/\[.*?\]/g, "").trim() || "—";
  const kd  = (k, d) => d > 0 ? (k / d).toFixed(2) : k;
  const wr  = (w, g) => g > 0 ? ((w / g) * 100).toFixed(1) + "%" : "0%";
  const hs  = (h, k) => k > 0 ? ((h / k) * 100).toFixed(1) + "%" : "0%";
  const TABS = { solo: statsCache?.solostats, duo: statsCache?.duostats, squad: statsCache?.quadstats };
  const s = TABS[tab];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-white font-black text-lg flex items-center gap-2"><FiUser className="text-cyan-400" /> Profile</h2>
        <p className="text-slate-500 text-xs mt-0.5">Your account & Free Fire player details</p>
      </div>

      {/* Account Info */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5" style={{ background: "rgba(6,182,212,0.05)" }}>
          <p className="text-xs font-black uppercase tracking-wider text-cyan-400">Account Details</p>
        </div>
        <div className="p-5 space-y-3">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            {user?.avatar
              ? <img src={user.avatar} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" alt="avatar" />
              : <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
                  {user?.name?.[0] || "P"}
                </div>
            }
            <div>
              <p className="text-white font-black text-base">{user?.name || "Player"}</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                user?.method === "Google" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
              }`}>{user?.method === "Google" ? "🔵 Google" : "✉️ Email"}</span>
            </div>
          </div>
          {/* Fields */}
          <div className="grid grid-cols-1 gap-2">
            {[
              { icon: FiMail,   label: "Email",   value: user?.email || "—" },
              { icon: FiShield, label: "Status",  value: user?.status || "active", color: "text-green-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl px-4 py-2.5 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <Icon className="text-slate-500 flex-shrink-0" size={14} />
                <span className="text-slate-500 text-xs w-16 flex-shrink-0">{label}</span>
                <span className={`text-sm font-bold ${color || "text-white"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Free Fire UID */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between" style={{ background: "rgba(249,115,22,0.05)" }}>
          <p className="text-xs font-black uppercase tracking-wider text-orange-400">Free Fire Identity</p>
          <button onClick={onChangeUID} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <FiEdit2 size={11} /> Change UID
          </button>
        </div>
        <div className="p-5">
          {ffUid && info ? (
            <div className="space-y-3">
              {/* Player header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                  {info.nickname?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-base truncate">{info.nickname}</p>
                  <p className="text-slate-400 text-xs">UID: {info.accountid} · {info.region} · {info.releaseversion}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-black text-lg">Lv.{info.level}</p>
                  <p className="text-slate-500 text-xs">{Number(info.exp || 0).toLocaleString()} XP</p>
                </div>
              </div>
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: "BR Rank Pts",  v: info.rankingpoints   || "—", c: "text-cyan-400"   },
                  { l: "CS Rank Pts",  v: info.csrankingpoints || "—", c: "text-purple-400" },
                  { l: "Likes",        v: Number(info.liked || 0).toLocaleString(), c: "text-pink-400" },
                  { l: "Credit Score", v: credit?.creditscore  || "—", c: "text-green-400"  },
                  { l: "Pet Level",    v: pet?.level || "—",           c: "text-orange-400" },
                  { l: "Last Online",  v: lastSeen(info.lastloginat),  c: "text-slate-300"  },
                ].map(({ l, v, c }) => (
                  <div key={l} className="rounded-xl p-3 text-center border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <p className={`font-black text-sm ${c}`}>{v}</p>
                    <p className="text-slate-600 text-xs mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
              {/* Guild + bio */}
              <div className="grid grid-cols-2 gap-2">
                {clan?.clanname && (
                  <div className="rounded-xl p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-slate-500 text-xs mb-0.5">Guild</p>
                    <p className="text-orange-400 font-bold text-sm">🏰 {clan.clanname}</p>
                    <p className="text-slate-500 text-xs">Lv.{clan.clanlevel} · {clan.membernum}/{clan.capacity}</p>
                  </div>
                )}
                {social?.modeprefer && (
                  <div className="rounded-xl p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-slate-500 text-xs mb-0.5">Preferred Mode</p>
                    <p className="text-white font-bold text-sm">{social.modeprefer.replace("MODEPREFER", "")}</p>
                  </div>
                )}
              </div>
              {social?.signature && (
                <div className="rounded-xl p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-slate-500 text-xs mb-0.5">Bio</p>
                  <p className="text-slate-300 text-sm">{cleanBio(social.signature)}</p>
                </div>
              )}

              {/* BR Career Stats */}
              {statsCache && (
                <div className="rounded-xl border border-white/5 overflow-hidden">
                  {/* Tab switcher */}
                  <div className="flex border-b border-white/5">
                    {["solo", "duo", "squad"].map(t => (
                      <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                          tab === t ? "text-orange-400 border-b-2 border-orange-400 bg-orange-400/5" : "text-slate-600 hover:text-slate-400"
                        }`}>{t}</button>
                    ))}
                  </div>
                  {/* Stats */}
                  {s?.gamesplayed ? (
                    <div className="grid grid-cols-4 divide-x divide-white/5">
                      {[
                        { l: "Games", v: s.gamesplayed?.toLocaleString() },
                        { l: "Wins",  v: s.wins?.toLocaleString(),                          c: "text-yellow-400" },
                        { l: "Kills", v: s.kills?.toLocaleString(),                         c: "text-red-400"    },
                        { l: "K/D",   v: kd(s.kills, s.detailedstats?.deaths),              c: "text-cyan-400"   },
                        { l: "Win%",  v: wr(s.wins, s.gamesplayed),                         c: "text-green-400"  },
                        { l: "HS%",   v: hs(s.detailedstats?.headshotKills, s.kills),       c: "text-orange-400" },
                        { l: "Best",  v: s.detailedstats?.highestKills || "—",              c: "text-purple-400" },
                        { l: "Dmg",   v: (Number(s.detailedstats?.damage || 0) / 1000).toFixed(0) + "K" },
                      ].map(({ l, v, c = "text-white" }) => (
                        <div key={l} className="py-3 text-center">
                          <p className={`font-black text-sm ${c}`}>{v}</p>
                          <p className="text-slate-600 text-xs mt-0.5">{l}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-xs text-center py-4">No {tab} stats available</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">No Free Fire UID linked yet.</p>
              <button onClick={onChangeUID} className="mt-2 text-xs text-orange-400 hover:text-orange-300 font-bold">+ Link your UID</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JoinMatchPage({ tournaments, loading, user, ffName, balance, onJoined }) {
  const { joinTournament } = useTournaments();
  const [joining, setJoining] = useState(null);
  const [filter, setFilter] = useState("all");
  const [successPopup, setSuccessPopup] = useState(null); // { name, fee, remaining }
  const [lowBalance, setLowBalance] = useState(null);    // { needed }

  const joinable = tournaments.filter(t => t.status !== "completed" && t.status !== "cancelled");
  const filtered = filter === "all" ? joinable : joinable.filter(t => t.status === filter);
  const [expiredIds, setExpiredIds] = useState(new Set());
  const markExpired = (id) => setExpiredIds(prev => new Set([...prev, id]));
  const getStatus = (t) => (t.status === "upcoming" && expiredIds.has(t._id)) ? "live" : t.status;

  const handleJoin = async (t) => {
    if (!user?._id) return toast.error("Not logged in");
    if (!user?.whatsapp) return toast.error("Add your WhatsApp number first to join!");
    const alreadyJoined = t.joinedPlayers?.find(p => p.id === user._id);
    if (alreadyJoined) return toast.error("You already joined this tournament!");
    if (t.slotsLeft <= 0) return toast.error("No slots left!");
    if ((balance ?? 0) < Number(t.entryFee)) {
      setLowBalance({ needed: t.entryFee });
      return;
    }
    setJoining(t._id);
    try {
      await joinTournament(t._id, user._id, ffName || user.name, user.email, t.entryFee);
      const remaining = (balance ?? 0) - Number(t.entryFee);
      setSuccessPopup({ name: t.name, fee: t.entryFee, remaining });
      onJoined();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to join");
    } finally { setJoining(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-white font-black text-lg flex items-center gap-2">
            <FiPlay className="text-cyan-400" /> Join Match
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Browse and join upcoming & live tournaments</p>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {["all", "upcoming", "live"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f ? "bg-cyan-400/20 text-cyan-400" : "text-slate-500 hover:text-white"
              }`}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading tournaments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <FiPlay className="text-slate-700 text-5xl mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-bold">No open tournaments right now</p>
          <p className="text-slate-600 text-xs mt-1">Check back soon for new matches!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t, i) => {
            const alreadyJoined = t.joinedPlayers?.find(p => p.id === user?._id);
            const full = t.slotsLeft <= 0;
            const status = getStatus(t);
            return (
              <motion.div key={t._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl border border-white/5 overflow-hidden flex flex-col"
              >
                {/* Card top */}
                <div className="px-4 py-3 border-b border-white/5 flex items-start justify-between gap-2"
                  style={{ background: "linear-gradient(135deg,rgba(6,182,212,0.07),rgba(168,85,247,0.07))" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-sm truncate">{t.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{t.matchType || t.mode}</span>
                      {t.map && t.map !== "—" && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">{t.map}</span>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 ${
                    status === "live" ? "bg-green-500/10 text-green-400 border-green-500/20 live-badge" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                  }`}>
                    {status === "live" ? "🔴 Live" : "⏰ Soon"}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-4 flex-1 space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <FiCalendar className="text-cyan-400 flex-shrink-0" size={13} />
                    <span className="text-slate-300">{t.date} · {fmt12(t.time)}</span>
                    <CountdownTimer date={t.date} time={t.time} onExpire={() => markExpired(t._id)} />
                  </div>

                  {/* Closing time countdown */}
                  {t.closingTime && status !== "live" && status !== "completed" && (
                    new Date(`${t.date}T${t.closingTime}`).getTime() <= Date.now()
                      ? (
                        <div className="flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 border border-red-500/30" style={{ background: "rgba(239,68,68,0.08)" }}>
                          <FiClock className="text-red-400 flex-shrink-0" size={12} />
                          <span className="text-red-400 font-bold">Registration Closed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 border border-red-500/20" style={{ background: "rgba(239,68,68,0.06)" }}>
                          <FiClock className="text-red-400 flex-shrink-0" size={12} />
                          <span className="text-slate-400">Registration closes in:</span>
                          <CountdownTimer date={t.date} time={t.closingTime} />
                        </div>
                      )
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg p-2 text-center" style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.15)" }}>
                      <p className="text-cyan-400 font-black text-sm">₹{Number(t.entryFee || 0).toLocaleString()}</p>
                      <p className="text-slate-500 text-xs">Entry</p>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.15)" }}>
                      <p className="text-yellow-400 font-black text-sm">₹{Number(t.prizeAmount || 0).toLocaleString()}</p>
                      <p className="text-slate-500 text-xs">Prize</p>
                    </div>
                    <div className="rounded-lg p-2 text-center" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
                      <p className="text-green-400 font-black text-sm">{t.slotsLeft}</p>
                      <p className="text-slate-500 text-xs">Slots</p>
                    </div>
                  </div>

                  <div className="w-full h-1 rounded-full bg-white/5">
                    <div className="h-1 rounded-full" style={{
                      width: `${((t.totalSlots - t.slotsLeft) / (t.totalSlots || 1)) * 100}%`,
                      background: "linear-gradient(90deg,#06b6d4,#a855f7)"
                    }} />
                  </div>

                  {/* Room Details */}
                  <RoomDetails
                    tournament={t}
                    isLive={status === "live"}
                    isJoined={!!alreadyJoined}
                  />

                  {(t.prize1st || t.prize2nd || t.prize3rd) && (
                    <div className="flex gap-1.5 flex-wrap">
                      {t.prize1st && <span className="text-xs px-2 py-0.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">🥇 ₹{Number(t.prize1st).toLocaleString()}</span>}
                      {t.prize2nd && <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-500/10 text-slate-300 border border-slate-500/20">🥈 ₹{Number(t.prize2nd).toLocaleString()}</span>}
                      {t.prize3rd && <span className="text-xs px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">🥉 ₹{Number(t.prize3rd).toLocaleString()}</span>}
                    </div>
                  )}

                  {t.description && (
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{t.description}</p>
                  )}
                </div>

                {/* Join button */}
                <div className="px-4 pb-4">
                  {alreadyJoined ? (
                    <div className="w-full py-2.5 rounded-xl text-center text-green-400 font-bold text-sm border border-green-500/20 bg-green-500/5">
                      ✅ Already Joined
                    </div>
                  ) : full ? (
                    <div className="w-full py-2.5 rounded-xl text-center text-slate-500 font-bold text-sm border border-white/5 bg-white/3">
                      🚫 Full
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(t)}
                      disabled={joining === t._id}
                      className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{ background: status === "live" ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#06b6d4,#a855f7)" }}
                    >
                      {joining === t._id
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Joining...</>
                        : status === "live" ? "🔴 Join Now" : "⏰ Register"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Success Popup */}
      <AnimatePresence>
        {successPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,10,20,0.98)", border: "2px solid rgba(34,197,94,0.4)", boxShadow: "0 0 40px rgba(34,197,94,0.2)" }}>
              <div className="px-6 pt-7 pb-4 text-center">
                <motion.div animate={{ scale: [1,1.3,1] }} transition={{ duration: 0.5 }} className="text-5xl mb-3">✅</motion.div>
                <h2 className="text-white font-black text-xl mb-1">Registration Successful!</h2>
                <p className="text-green-400 text-sm">You joined <span className="font-black">{successPopup.name}</span></p>
              </div>
              <div className="mx-6 mb-4 rounded-xl border border-green-500/20 p-4 space-y-2" style={{ background: "rgba(34,197,94,0.06)" }}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Entry Fee Deducted</span>
                  <span className="text-red-400 font-black">₹{Number(successPopup.fee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Remaining Balance</span>
                  <span className="text-green-400 font-black">₹{Number(successPopup.remaining).toLocaleString()}</span>
                </div>
              </div>
              <div className="mx-6 mb-5 rounded-xl border border-cyan-500/20 p-3 text-center" style={{ background: "rgba(6,182,212,0.06)" }}>
                <p className="text-cyan-400 text-sm font-bold">🔥 Good luck for the match!</p>
              </div>
              <div className="px-6 pb-6">
                <button onClick={() => setSuccessPopup(null)}
                  className="w-full py-3 rounded-xl text-white font-black text-sm"
                  style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
                  Awesome! Let's Go 🎮
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Low Balance Popup */}
      <AnimatePresence>
        {lowBalance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,10,20,0.98)", border: "2px solid rgba(239,68,68,0.4)", boxShadow: "0 0 40px rgba(239,68,68,0.15)" }}>
              <div className="px-6 pt-7 pb-4 text-center">
                <div className="text-5xl mb-3">❌</div>
                <h2 className="text-white font-black text-xl mb-1">Insufficient Balance</h2>
                <p className="text-slate-400 text-sm">You need <span className="text-red-400 font-black">₹{Number(lowBalance.needed).toLocaleString()}</span> to join this tournament.</p>
              </div>
              <div className="mx-6 mb-5 rounded-xl border border-red-500/20 p-3 text-center" style={{ background: "rgba(239,68,68,0.06)" }}>
                <p className="text-slate-400 text-xs">Please add money to your wallet and try again.</p>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => setLowBalance(null)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 font-bold text-sm">Cancel</button>
                <Link to="/wallet" onClick={() => setLowBalance(null)}
                  className="flex-1 py-3 rounded-xl text-white font-black text-sm text-center"
                  style={{ background: "linear-gradient(135deg,#06b6d4,#a855f7)" }}>
                  Go to Wallet
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HistoryPage({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    API.get(`/tournaments/user/${userId}`)
      .then(({ data }) => setHistory(data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-white font-black text-lg flex items-center gap-2">
          <FiClock className="text-cyan-400" /> Match History
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">All tournaments you have joined</p>
      </div>

      {loading ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <FiClock className="text-slate-700 text-5xl mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-bold">No match history yet</p>
          <p className="text-slate-600 text-xs mt-1">Join a tournament to see it here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((t, i) => {
            const joinedAt = t.joinedPlayers?.find(p => p.id === userId)?.joinedAt;
            return (
              <motion.div key={t._id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass rounded-2xl border border-white/5 overflow-hidden"
              >
                <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5"
                  style={{ background: "linear-gradient(135deg,rgba(6,182,212,0.06),rgba(168,85,247,0.06))" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-sm truncate">{t.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{t.matchType || t.mode}</span>
                      {t.map && t.map !== "—" && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">{t.map}</span>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 ${
                    t.status === "live" ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : t.status === "completed" ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                  }`}>
                    {t.status === "live" ? "🔴 Live" : t.status === "completed" ? "✅ Completed" : "⏰ Upcoming"}
                  </span>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-slate-500 text-xs">Date & Time</p>
                    <p className="text-white text-xs font-bold mt-0.5">{t.date} · {fmt12(t.time)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Entry Fee</p>
                    <p className="text-cyan-400 font-black text-sm mt-0.5">₹{Number(t.entryFee || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Prize Pool</p>
                    <p className="text-yellow-400 font-black text-sm mt-0.5">₹{Number(t.prizeAmount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Joined On</p>
                    <p className="text-slate-300 text-xs font-bold mt-0.5">
                      {joinedAt ? new Date(joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h2 className="text-white font-black text-lg flex items-center gap-2">
          <FiHelpCircle className="text-cyan-400" /> Support
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">Need help? We're here for you</p>
      </div>

      {/* WhatsApp Card */}
      <div
        className="glass rounded-2xl border border-green-500/20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(22,163,74,0.04))" }}
      >
        <div className="px-5 py-3 border-b border-green-500/10" style={{ background: "rgba(34,197,94,0.05)" }}>
          <p className="text-xs font-black uppercase tracking-wider text-green-400">WhatsApp Support</p>
        </div>
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
          >
            <FaWhatsapp className="text-white text-3xl" />
          </div>
          <div>
            <p className="text-white font-black text-base">Chat on WhatsApp</p>
            <p className="text-slate-400 text-sm mt-1">Get quick help on WhatsApp</p>
          </div>
          <a
            href="https://wa.me/919508012773"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 hover:scale-105"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
          >
            <FaWhatsapp size={18} />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function WhatsAppSection({ user, onSaved }) {
  const existing = user?.whatsapp || "";
  const [cc, setCc]         = useState("+91");
  const [number, setNumber] = useState(existing.length > 10 ? existing.slice(-10) : existing);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]   = useState(!!existing);

  const CODES = ["+91","+1","+44","+61","+971","+65","+60","+880","+92","+94"];

  const handleSave = async () => {
    const digits = number.replace(/\D/g, "");
    if (digits.length !== 10) return setError("Enter a valid 10-digit WhatsApp number");
    setError(""); setLoading(true);
    try {
      const { data } = await API.patch(`/users/${user._id}/whatsapp`, { whatsapp: cc.replace("+","") + digits });
      toast.success(existing ? "WhatsApp number updated successfully! ✅" : "WhatsApp number saved successfully! ✅");
      setSaved(true);
      onSaved?.(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save");
    } finally { setLoading(false); }
  };

  return (
    <div className="glass rounded-2xl border border-green-500/20 overflow-hidden"
      style={{ background: "linear-gradient(135deg,rgba(34,197,94,0.06),rgba(6,182,212,0.04))" }}>
      <div className="px-5 py-3 border-b border-green-500/10 flex items-center justify-between"
        style={{ background: "rgba(34,197,94,0.05)" }}>
        <div className="flex items-center gap-2">
          <FaWhatsapp className="text-green-400" size={16} />
          <p className="text-xs font-black uppercase tracking-wider text-green-400">WhatsApp for Prize Payment</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#22c55e"/>
              <path d="M6.5 12.5L10 16L17.5 8.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-green-400 text-xs font-bold">Verified</span>
          </div>
        )}
      </div>
      <div className="p-5 space-y-3">
        <p className="text-white font-black text-base tracking-wide" style={{ textShadow: "0 0 20px rgba(255,255,255,0.4)" }}>📲 Enter your WhatsApp number to receive tournament winning amount.</p>
        <div className="flex gap-2">
          <select
            value={cc} onChange={e => setCc(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-slate-300 text-sm outline-none focus:border-green-400 transition-all flex-shrink-0"
            style={{ background: "#0a0f0a" }}>
            {CODES.map(c => <option key={c} value={c} style={{ background: "#0a0f0a" }}>{c}</option>)}
          </select>
          <input
            type="tel" maxLength={10}
            placeholder="Enter WhatsApp Number"
            value={number}
            onChange={e => { setNumber(e.target.value.replace(/\D/g,"")); setError(""); setSaved(false); }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/20 ${
              error ? "border-2 border-red-500 bg-red-500/5" : "border border-white/10 bg-white/5 focus:border-green-400 focus:bg-green-400/5"
            }`}
          />
          <button
            onClick={handleSave} disabled={loading}
            className="px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : existing ? "Update" : "Save"}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs flex items-center gap-1.5"><FiX size={12}/>{error}</p>}
        {saved && !error && (
          <p className="text-green-400 text-xs flex items-center gap-1.5">
            <FaWhatsapp size={12}/> {cc} {number} · Ready to receive prizes
          </p>
        )}
      </div>
    </div>
  );
}

const fmt12 = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2,"0")}:${String(m).padStart(2,"0")} ${ampm}`;
};

const recentHistory = [];

export default function Dashboard() {
  const [active, setActive] = useState(() => localStorage.getItem("ff_active_tab") || "dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [uidInput, setUidInput] = useState("");
  const [uidError, setUidError] = useState("");
  const [uidLoading, setUidLoading] = useState(false);
  const [uidServer, setUidServer] = useState("IND");
  const [wallet, setWallet] = useState(null);
  const [winnerPopup, setWinnerPopup] = useState(null);
  const [winnerBanner, setWinnerBanner] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user, logout, ffUid, ffName, setFFProfile } = useAuth();
  const { tournaments, loading } = useTournaments();
  const nav = useNavigate();
  const hasUID = !!ffUid;

  const fetchWallet = useCallback(async () => {
    if (!user?._id) return;
    try { const { data } = await API.get(`/wallet/${user._id}`); setWallet(data); } catch {}
  }, [user?._id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;
    try { const { data } = await API.get(`/notifications/user/${user._id}`); setNotifications(data); } catch {}
  }, [user?._id]);

  const checkWinnerPopup = useCallback(async () => {
    if (!user?._id) return;
    try {
      const { data } = await API.get(`/notifications/user/${user._id}/winner-popup`);
      if (data) {
        setWinnerPopup(data);
        // show banner if within 1 hour
        const age = Date.now() - new Date(data.createdAt).getTime();
        if (age < 60 * 60 * 1000) setWinnerBanner(data);
      }
      // also check any winner notif within last 1 hour for banner
      const { data: all } = await API.get(`/notifications/user/${user._id}`);
      const recent = all.find(n => n.type === "winner" && (Date.now() - new Date(n.createdAt).getTime()) < 60 * 60 * 1000);
      if (recent) setWinnerBanner(recent);
    } catch {}
  }, [user?._id]);

  useEffect(() => {
    fetchWallet();
    fetchNotifications();
    checkWinnerPopup();
  }, [fetchWallet, fetchNotifications, checkWinnerPopup]);

  // Socket — real-time winner notification
  useEffect(() => {
    if (!user?._id) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace("/api","") || "http://localhost:5000", { reconnectionAttempts: 2, timeout: 3000 });
    socket.on(`winner:${user._id}`, (notif) => {
      setWinnerPopup(notif);
      setWinnerBanner(notif);
      fetchNotifications();
    });
    return () => socket.disconnect();
  }, [user?._id]);

  const dismissWinnerPopup = async () => {
    if (winnerPopup?._id) {
      await API.patch(`/notifications/${winnerPopup._id}/popup-shown`).catch(() => {});
    }
    setWinnerPopup(null);
  };

  // Auto-hide banner after 1 hour
  useEffect(() => {
    if (!winnerBanner) return;
    const age = Date.now() - new Date(winnerBanner.createdAt).getTime();
    const remaining = Math.max(0, 60 * 60 * 1000 - age);
    const t = setTimeout(() => setWinnerBanner(null), remaining);
    return () => clearTimeout(t);
  }, [winnerBanner]);

  useEffect(() => { if (ffUid) setUidInput(ffUid); }, [ffUid]);

  const balance = wallet?.balance ?? 0;

  const submitUID = async (e) => {
    e.preventDefault();
    const val = uidInput.trim();
    if (!val) return setUidError("UID cannot be empty");
    if (!/^\d+$/.test(val)) return setUidError("UID must be numeric only");
    setUidLoading(true); setUidError("");
    try {
      const { data } = await API.get(`/garena/player/${val}?server=${uidServer}`);
      const name = data?.basicinfo?.nickname || data?.basicInfo?.nickname || data?.basicinfo?.name;
      if (!name) throw new Error("Player not found");
      setFFProfile(val, name);
      if (user?._id) API.patch(`/users/${user._id}/ff-profile`, { ffUid: val, ffName: name }).catch(() => {});
      toast.success(`Welcome, ${name}! 🔥`);
      setUidError("");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || "";
      if (err?.response?.status === 404 || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("player data not found")) {
        setUidError("Player not found. Check UID and server region.");
      } else if (err?.response?.status === 401 || msg.toLowerCase().includes("auth") || msg.toLowerCase().includes("login")) {
        setUidError("Game server authentication failed. Please try again in a moment.");
      } else if (!err?.response || err?.code === "ERR_NETWORK") {
        setUidError("Cannot connect to server. Make sure backend is running.");
      } else {
        setUidError("Unable to fetch player. Try a different server region or try again.");
      }
    } finally {
      setUidLoading(false);
    }
  };

  const handleNavClick = (id) => {
    if (!hasUID && LOCKED.includes(id)) {
      toast.error("Enter your Free Fire UID first!");
      return;
    }
    setActive(id);
    localStorage.setItem("ff_active_tab", id);
    setSideOpen(false);
  };

  const handleLogout = () => { logout(); localStorage.removeItem("ff_active_tab"); toast.success("Logged out!"); nav("/"); };

  const stats = [
    { label: "Wallet Balance", value: `₹${balance.toLocaleString()}`, icon: FiDollarSign, color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400" },
    { label: "Matches Joined", value: String(tournaments.filter(t => t.joinedPlayers?.find(p => p.id === user?._id)).length), icon: FiPlay, color: "from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400" },
    { label: "Total Wins", value: "0", icon: GiTrophy, color: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/20 text-yellow-400" },
    { label: "Total Earnings", value: "₹0", icon: FiTrendingUp, color: "from-green-500/20 to-green-500/5 border-green-500/20 text-green-400" },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass-dark border-r border-white/5 flex flex-col transition-transform duration-300 ${sideOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
              <FiZap className="text-white text-sm" />
            </div>
            <span className="text-lg font-black gradient-text">FIREFIREGG</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-black">
              {user?.name?.[0] || "P"}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{user?.name || "Player"}</p>
              <p className="text-xs truncate" style={{ color: ffName ? "#f97316" : "" }}>
                {ffName || "Free Fire Player"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, id }) => {
            const locked = !hasUID && LOCKED.includes(id);
            return (
              <button key={id} onClick={() => handleNavClick(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active === id ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                  : locked ? "text-slate-600 cursor-not-allowed"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}>
                <Icon className="text-base flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {locked && <FiLock size={11} className="flex-shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sideOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSideOpen(false)} />}

      {/* Main */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass-dark border-b border-white/5 px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSideOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <FiMenu size={20} />
            </button>
            <h1 className="text-white font-bold capitalize">{active}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <FiBell size={18} />
            </button>
            <div className="relative">
              <button onClick={() => setDropOpen(o => !o)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">
                {user?.name?.[0] || "P"}
              </button>
              {dropOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
                  <div className="absolute right-0 top-10 w-44 z-50 glass-dark border border-white/10 rounded-xl overflow-hidden shadow-xl">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-white font-bold text-xs truncate">{user?.name || "Player"}</p>
                      <p className="text-xs truncate" style={{ color: ffName ? "#f97316" : "#64748b" }}>{ffName || "Free Fire Player"}</p>
                    </div>
                    <button onClick={() => { setActive("profile"); setDropOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-medium transition-all">
                      <FiUser size={13} /> Profile
                    </button>
                    <button onClick={() => { handleLogout(); setDropOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-all">
                      <FiLogOut size={13} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-6xl mx-auto">

          {/* Winner scrolling banner */}
          <AnimatePresence>
            {winnerBanner && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="relative mb-4 rounded-xl overflow-hidden"
                style={{ background: "linear-gradient(135deg,#0a0800,#1a1200)", border: "1.5px solid rgba(250,204,21,0.5)", boxShadow: "0 0 24px rgba(250,204,21,0.2)" }}
              >
                {/* Glow line */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,#facc15,transparent)" }} />
                <div className="flex items-center gap-3 px-4 py-2.5 overflow-hidden">
                  <span className="text-xl flex-shrink-0 animate-bounce">🏆</span>
                  {/* Marquee text */}
                  <div className="flex-1 overflow-hidden">
                    <div className="whitespace-nowrap"
                      style={{ animation: "marquee 18s linear infinite", display: "inline-block" }}>
                      <span className="text-yellow-400 font-black text-sm">
                        🎉 Congratulations! You are the Winner! &nbsp;&nbsp;&nbsp;
                        You won {winnerBanner.tournamentName}. &nbsp;
                        Prize: ₹{Number(winnerBanner.prizeAmount).toLocaleString()}. &nbsp;
                        Our team will connect to you instantly!! &nbsp;&nbsp;&nbsp;
                        📅 {new Date(winnerBanner.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, {new Date(winnerBanner.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      </span>
                      {/* Duplicate for seamless loop */}
                      <span className="text-yellow-400 font-black text-sm">
                        🎉 Congratulations! You are the Winner! &nbsp;&nbsp;&nbsp;
                        You won {winnerBanner.tournamentName}. &nbsp;
                        Prize: ₹{Number(winnerBanner.prizeAmount).toLocaleString()}. &nbsp;
                        Our team will connect to you instantly!! &nbsp;&nbsp;&nbsp;
                        📅 {new Date(winnerBanner.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, {new Date(winnerBanner.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setWinnerBanner(null)} className="text-yellow-400/50 hover:text-yellow-400 transition-colors flex-shrink-0 ml-2">
                    <FiX size={14} />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,#facc15,transparent)" }} />
              </motion.div>
            )}
          </AnimatePresence>
          {active === "tournaments" ? (
            <MyTournaments tournaments={tournaments} loading={loading} user={user} onJoin={() => setActive("join")} />
          ) : active === "join" ? (
            <JoinMatchPage tournaments={tournaments} loading={loading} user={user} ffName={ffName} balance={balance} onJoined={() => { fetchWallet(); setActive("history"); }} />
          ) : active === "wallet" ? (
            <div className="max-w-2xl mx-auto">
              <div className="mb-5">
                <h2 className="text-white font-black text-lg flex items-center gap-2">
                  <FiDollarSign className="text-cyan-400" /> Wallet
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">Manage your balance</p>
              </div>
              <div className="glass rounded-2xl border border-cyan-500/20 p-6 mb-4" style={{ background: "linear-gradient(135deg,rgba(6,182,212,0.08),rgba(168,85,247,0.05))" }}>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Balance</p>
                <p className="text-white font-black text-4xl mb-5">₹{balance.toLocaleString()}</p>
                <div className="flex gap-3">
                  <Link to="/wallet" className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-bold text-center">+ Add Money</Link>
                  <button onClick={() => toast("⏳ Withdraw coming soon!", { icon: "🚧" })} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm font-bold text-center">Withdraw</button>
                </div>
              </div>
              {/* Transactions */}
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5">
                  <p className="text-white font-bold text-sm">Transaction History</p>
                </div>
                <div className="divide-y divide-white/5">
                  {(wallet?.transactions?.length ?? 0) === 0 ? (
                    <div className="py-10 text-center">
                      <FiDollarSign className="text-slate-700 text-3xl mx-auto mb-2" />
                      <p className="text-slate-400 text-sm font-bold">No transactions yet</p>
                      <p className="text-slate-600 text-xs mt-1">Add money to get started</p>
                    </div>
                  ) : [...(wallet?.transactions ?? [])].reverse().map((t, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        t.type === "credit" ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
                      }`}>
                        {t.type === "credit"
                          ? <FiTrendingUp className="text-green-400" size={13} />
                          : <FiDollarSign className="text-red-400" size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate">{t.label}</p>
                        <p className="text-slate-500 text-xs">{new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <p className={`font-black text-sm flex-shrink-0 ${
                        t.type === "credit" ? "text-green-400" : "text-red-400"
                      }`}>{t.type === "credit" ? "+" : "-"}₹{Number(t.amount).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : active === "history" ? (
            <HistoryPage userId={user?._id} />
          ) : active === "notifications" ? (
            <div className="max-w-2xl mx-auto">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-white font-black text-lg flex items-center gap-2">
                    <FiBell className="text-cyan-400" /> Notifications
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">Your recent alerts and updates</p>
                </div>
                {notifications.length > 0 && (
                  <button onClick={() => API.patch(`/notifications/user/${user._id}/read-all`).then(fetchNotifications)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors">Mark all read</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="glass rounded-2xl border border-white/5 p-12 text-center">
                  <FiBell className="text-slate-700 text-5xl mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-bold">No notifications yet</p>
                  <p className="text-slate-600 text-xs mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n, i) => (
                    <motion.div key={n._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => !n.read && API.patch(`/notifications/${n._id}/read`).then(fetchNotifications)}
                      className={`glass rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                        n.type === "winner" ? "border-yellow-500/30" : "border-white/5"
                      } ${!n.read ? "bg-white/3" : ""}`}>
                      <div className="flex items-start gap-3 px-4 py-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
                          n.type === "winner" ? "bg-yellow-500/10" : "bg-cyan-500/10"
                        }`}>
                          {n.type === "winner" ? "🏆" : "🔔"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-black text-sm ${n.type === "winner" ? "text-yellow-400" : "text-white"}`}>{n.title}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{n.message}</p>
                          <p className="text-slate-600 text-xs mt-1">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1" />}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : active === "support" ? (
            <SupportPage />
          ) : active === "profile" ? (
            <ProfilePage user={user} ffUid={ffUid} ffName={ffName} uidServer={uidServer}
              onChangeUID={() => { localStorage.removeItem("ff_uid"); localStorage.removeItem("ff_ingame_name"); localStorage.removeItem("ff_player_cache"); localStorage.removeItem("ff_stats_cache"); setFFProfile("",""); setActive("dashboard"); toast.success("UID cleared. Enter a new one."); }}
            />
          ) : (<>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass rounded-xl p-4 bg-gradient-to-br ${s.color} border card-hover`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs uppercase tracking-wider">{s.label}</span>
                  <s.icon className="text-base opacity-60" />
                </div>
                <p className="text-white font-black text-xl">{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* UID Gate — shown if no UID stored */}
          <AnimatePresence>
            {!hasUID && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-6 rounded-2xl border border-orange-500/30 p-5"
                style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(239,68,68,0.05))" }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
                    <FiSearch className="text-white" size={18} />
                  </div>
                  <div>
                    <h2 className="font-black text-base" style={{ background: "linear-gradient(90deg,#f97316,#ef4444,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      Enter your Free Fire UID to continue
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">Required to access tournaments, wallet & all features</p>
                  </div>
                </div>
                <form onSubmit={submitUID} className="flex gap-2">
                  <select value={uidServer} onChange={e => setUidServer(e.target.value)}
                    className="bg-white/5 border border-orange-400/30 rounded-xl px-2 py-2.5 text-slate-300 text-xs outline-none focus:border-orange-400"
                    style={{ background: "#0a0505" }}>
                    {["IND","SG","BR","US","ID","TW","TH","VN","ME","PK","BD","CIS","RU"].map(s => (
                      <option key={s} value={s} style={{ background: "#0a0505" }}>{s}</option>
                    ))}
                  </select>
                  <input
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all placeholder:text-white/20 ${
                      uidError
                        ? "border-2 border-red-500 bg-red-500/5"
                        : "border border-orange-400/30 bg-white/5 focus:border-orange-400 focus:bg-orange-400/5"
                    }`}
                    placeholder="e.g. 1633864660"
                    value={uidInput}
                    onChange={e => { setUidInput(e.target.value); setUidError(""); }}
                  />
                  <button type="submit" disabled={uidLoading || !uidInput.trim()}
                    className="px-5 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-all flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
                    {uidLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiSearch size={14} /> Verify</>}
                  </button>
                </form>
                {uidError && (
                  <p className="flex items-center gap-1.5 text-red-400 text-xs mt-2">
                    <FiX size={12} /> {uidError}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player Lookup - shown after UID verified */}
          {hasUID && (
            <div className="mb-6">
              <PlayerLookup initialUid={ffUid} tournaments={tournaments} loadingTournaments={loading} onViewAll={() => setActive("tournaments")} />
            </div>
          )}

          {/* WhatsApp Prize Number */}
          {hasUID && (
            <div className="mb-6">
              <WhatsAppSection user={user} onSaved={(updated) => {
                // update local user state with new whatsapp
                const stored = JSON.parse(localStorage.getItem("ff_user") || "{}");
                localStorage.setItem("ff_user", JSON.stringify({ ...stored, whatsapp: updated.whatsapp }));
              }} />
            </div>
          )}

          </>)}
        </div>
      </main>

      {/* Winner Popup */}
      <AnimatePresence>
        {winnerPopup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-full max-w-md rounded-3xl overflow-hidden relative"
              style={{ background: "linear-gradient(135deg,#0a0800,#1a1200)", border: "2px solid rgba(250,204,21,0.5)", boxShadow: "0 0 60px rgba(250,204,21,0.3),0 0 120px rgba(250,204,21,0.1)" }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg,rgba(250,204,21,0.05) 0%,transparent 50%,rgba(250,204,21,0.05) 100%)" }} />
              <div className="px-6 pt-8 pb-4 text-center relative">
                <motion.div animate={{ rotate: [0,-10,10,-10,10,0], scale: [1,1.2,1] }} transition={{ duration: 0.8, delay: 0.3 }} className="text-6xl mb-3">🏆</motion.div>
                <h2 className="text-2xl font-black mb-1" style={{ background: "linear-gradient(90deg,#facc15,#f97316,#facc15)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Congratulations!</h2>
                <p className="text-yellow-400/80 text-sm">You are the Winner! 🎉</p>
              </div>
              <div className="px-6 pb-6 space-y-3">
                <div className="rounded-2xl border border-yellow-500/20 p-4 space-y-2" style={{ background: "rgba(250,204,21,0.05)" }}>
                  {winnerPopup.tournamentName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Tournament</span>
                      <span className="text-white font-black text-sm">{winnerPopup.tournamentName}</span>
                    </div>
                  )}
                  {winnerPopup.prizeAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Prize Amount</span>
                      <span className="text-yellow-400 font-black text-xl">₹{Number(winnerPopup.prizeAmount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Date</span>
                    <span className="text-slate-300 text-sm">{new Date(winnerPopup.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-green-500/20 p-3 text-center" style={{ background: "rgba(34,197,94,0.07)" }}>
                  <p className="text-green-400 text-sm font-bold">📞 Our team will connect to you instantly!!</p>
                </div>
                <button onClick={dismissWinnerPopup}
                  className="w-full py-3 rounded-xl text-white font-black text-sm transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#facc15,#f97316)" }}>
                  🎉 Awesome! Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
