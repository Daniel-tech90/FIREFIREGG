import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiHome, FiUsers, FiAward, FiDollarSign, FiSettings,
  FiLogOut, FiMenu, FiZap, FiAlertCircle,
  FiCheckCircle, FiEye, FiTrash2, FiPlus, FiBell, FiX, FiCalendar, FiClock,
  FiCheck, FiXCircle, FiSearch, FiEdit2, FiDownload, FiGift
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { GiTrophy } from "react-icons/gi";
import { useAuth } from "../../context/AuthContext";
import { io } from "socket.io-client";
import API from "../../api/axios";
import CountdownTimer from "../../components/CountdownTimer";
import PlayerLookup from "../../components/PlayerLookup";

const navItems = [
  { icon: FiHome,      label: "Dashboard",    id: "dashboard"   },
  { icon: FiAward,     label: "Tournaments",   id: "tournaments"  },
  { icon: FiUsers,     label: "Users",         id: "users"        },
  { icon: FiDollarSign,label: "Deposits",      id: "deposits"     },
  { icon: FiGift,      label: "Prize Data",    id: "prizedata"    },
  { icon: FiClock,     label: "Winner History",id: "history"      },
  { icon: FiBell,      label: "Notifications", id: "notifications"},
  { icon: FiSettings,  label: "Settings",      id: "settings"     },
];

const MODES = ["Solo", "Duo", "Squad", "1v1 Clash", "Clash Squad"];
const MAPS = ["Bermuda", "Kalahari", "Purgatory", "Alpine", "Nexterra"];

function useTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const { data } = await API.get("/tournaments");
      setTournaments(data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => {
    fetch();
    // Listen for real-time updates via socket
    const socket = io(import.meta.env.VITE_API_URL?.replace("/api","") || "http://localhost:5000", { reconnectionAttempts: 2, timeout: 3000 });
    socket.on("tournament:created",  (t) => setTournaments(prev => [t, ...prev]));
    socket.on("tournament:updated",  (t) => setTournaments(prev => prev.map(x => (x._id || x.id) === t._id ? t : x)));
    socket.on("tournament:deleted", ({ id }) => setTournaments(prev => prev.filter(x => (x._id || x.id) !== id)));
    return () => socket.disconnect();
  }, []);

  const add = (t) => setTournaments(prev => [t, ...prev]);

  const remove = async (id) => {
    try {
      await API.delete(`/tournaments/${id}`);
      setTournaments(prev => prev.filter(t => (t._id || t.id) !== id));
      toast.success("Tournament deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return { tournaments, loading, add, remove };
}

function ClashSquadModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", date: "", time: "", prizeAmount: "", totalSlots: "20", entryFee: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const { name, date, time, prizeAmount, totalSlots, entryFee } = form;
    if (!name || !date || !time || !prizeAmount || !totalSlots || !entryFee)
      return toast.error("Fill all required fields");
    setLoading(true);
    try {
      const payload = {
        name,
        matchType: "Clash Squad 1v1",
        date,
        time,
        prizeAmount: Number(prizeAmount),
        entryFee: Number(entryFee),
        totalSlots: Number(totalSlots),
        slotsLeft: Number(totalSlots),
      };
      const { data } = await API.post("/tournaments", payload);
      onSave({ ...payload, id: data._id || Date.now(), mode: "Clash Squad 1v1", map: "—", prizePool: prizeAmount, maxSlots: totalSlots });
      toast.success("Clash Squad 1v1 tournament created! ⚔️");
      onClose();
    } catch (err) {
      console.error("ClashSquad error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to create tournament");
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:border-orange-400 focus:bg-orange-400/5 transition-all placeholder:text-white/20";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg"
        style={{ background: "rgba(10,5,5,0.97)", border: "1px solid rgba(251,146,60,0.25)", borderRadius: "1.5rem" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
              <span className="text-lg">⚔️</span>
            </div>
            <div>
              <h2 className="text-white font-black text-base">Clash Squad 1v1</h2>
              <p className="text-slate-500 text-xs">Create a new 1v1 tournament</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Match Name */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Match Name *</label>
            <input className={inp} placeholder="e.g. Clash Squad 1v1 — Season 1" value={form.name} onChange={set("name")} />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                <FiCalendar className="inline mr-1" />Date *
              </label>
              <input type="date" className={inp} value={form.date} onChange={set("date")} style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                <FiClock className="inline mr-1" />Time *
              </label>
              <input type="time" className={inp} value={form.time} onChange={set("time")} style={{ colorScheme: "dark" }} />
            </div>
          </div>

          {/* Prize Amount & Entry Fee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Prize Amount (₹) *</label>
              <input type="number" className={inp} placeholder="e.g. 5000" value={form.prizeAmount} onChange={set("prizeAmount")} min="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Entry Fee (₹) *</label>
              <input type="number" className={inp} placeholder="e.g. 50" value={form.entryFee} onChange={set("entryFee")} min="0" />
            </div>
          </div>

          {/* Player Slots */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Player Slots *</label>
            <input type="number" className={inp} placeholder="e.g. 20" value={form.totalSlots} onChange={set("totalSlots")} min="2" max="20" />
          </div>

          {/* Live Preview */}
          {form.name && (
            <div className="rounded-xl p-4 border border-orange-400/20 bg-orange-400/5">
              <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mb-2">⚔️ Preview</p>
              <p className="text-white font-black text-sm">{form.name}</p>
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
                <span className="text-slate-400">{form.date} {form.time}</span>
                <span className="text-yellow-400 font-bold">₹{Number(form.prizeAmount || 0).toLocaleString()} prize</span>
                <span className="text-cyan-400 font-bold">₹{Number(form.entryFee || 0).toLocaleString()} entry</span>
                <span className="text-slate-400">{form.totalSlots || 0} slots</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm font-bold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}>
              {loading ? "Creating..." : "⚔️ Create Tournament"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function CreateModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", mode: "Solo", map: "Bermuda", date: "", time: "",
    entryFee: "", prizePool: "", maxSlots: "20",
    perKill: "", rules: "",
    prize1: "", prize2: "", prize3: "", prizeCount: 1,
  });
  const [loading, setLoading] = useState(false);
  const set = useCallback((k) => (e) => setForm(f => ({ ...f, [k]: e.target.value })), []);
  const addPrize = () => setForm(f => ({ ...f, prizeCount: Math.min(f.prizeCount + 1, 3) }));
  const removePrize = (i) => setForm(f => ({ ...f, prizeCount: f.prizeCount - 1, [`prize${i + 1}`]: "" }));

  const preview = useMemo(() => form.name ? (
    <div className="glass rounded-xl p-4 border border-cyan-400/20 bg-cyan-400/5">
      <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-2">Preview</p>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-white font-black">{form.name}</p>
          <p className="text-slate-400 text-xs">{form.mode} • {form.map} • {form.date} {form.time}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="text-cyan-400 font-bold">₹{form.entryFee || 0} entry</span>
          <span className="text-yellow-400 font-bold">₹{Number(form.prizePool || 0).toLocaleString()} prize</span>
          <span className="text-slate-400">{form.maxSlots || 0} slots</span>
        </div>
      </div>
    </div>
  ) : null, [form.name, form.mode, form.map, form.date, form.time, form.entryFee, form.prizePool, form.maxSlots]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.time || !form.entryFee || !form.prizePool || !form.maxSlots)
      return toast.error("Fill all required fields");
    setLoading(true);
    try {
      const payload = {
        name: form.name, matchType: form.mode, mode: form.mode, map: form.map,
        date: form.date, time: form.time,
        entryFee: Number(form.entryFee), prizeAmount: Number(form.prizePool),
        totalSlots: Number(form.maxSlots), slotsLeft: Number(form.maxSlots),
        prize1st: form.prize1, prize2nd: form.prize2, prize3rd: form.prize3,
        perKill: form.perKill || "", rules: form.rules || "",
      };
      const { data } = await API.post("/tournaments", payload);
      onSave(data);
      toast.success("Tournament created! 🏆");
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create tournament");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:border-cyan-400 focus:bg-cyan-400/5 transition-all placeholder:text-white/20";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl flex flex-col"
        style={{ background: "rgba(10,5,5,0.97)", border: "1px solid rgba(255,59,59,0.2)", borderRadius: "1.5rem", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-500/10 flex-shrink-0">
          <div>
            <h2 className="text-white font-black text-lg">Create Tournament</h2>
            <p className="text-slate-500 text-xs">Fill all details to publish a new tournament</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5 overflow-y-auto">
          {/* Tournament Name */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Tournament Name *</label>
            <input className={inputCls} placeholder="e.g. Free Fire Grand Clash #1" value={form.name} onChange={set("name")} />
          </div>

          {/* Mode & Map */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Game Mode *</label>
              <select className={inputCls} value={form.mode} onChange={set("mode")} style={{ background: "#0a0505" }}>
                {MODES.map(m => <option key={m} value={m} style={{ background: "#0a0505" }}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Map</label>
              <select className={inputCls} value={form.map} onChange={set("map")} style={{ background: "#0a0505" }}>
                {MAPS.map(m => <option key={m} value={m} style={{ background: "#0a0505" }}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                <FiCalendar className="inline mr-1" />Date *
              </label>
              <input type="date" className={inputCls} value={form.date} onChange={set("date")} style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                <FiClock className="inline mr-1" />Time *
              </label>
              <input type="time" className={inputCls} value={form.time} onChange={set("time")} style={{ colorScheme: "dark" }} />
            </div>
          </div>

          {/* Entry Fee, Prize Pool, Max Slots */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Entry Fee (₹) *</label>
              <input type="number" className={inputCls} placeholder="e.g. 50" value={form.entryFee} onChange={set("entryFee")} min="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Prize Pool (₹) *</label>
              <input type="number" className={inputCls} placeholder="e.g. 5000" value={form.prizePool} onChange={set("prizePool")} min="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Max Slots *</label>
              <input type="number" className={inputCls} placeholder="e.g. 20" value={form.maxSlots} onChange={set("maxSlots")} min="2" max="20" />
            </div>
          </div>

          {/* Prize Distribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-slate-400 uppercase tracking-wider">Prize Distribution (₹)</label>
              {form.prizeCount < 3 && (
                <button type="button" onClick={addPrize}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors">
                  <FiPlus size={11} /> Add {form.prizeCount === 1 ? "2nd" : "3rd"} Place
                </button>
              )}
            </div>
            <div className="space-y-2">
              {Array.from({ length: form.prizeCount }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm w-6 flex-shrink-0">{["🥇","🥈","🥉"][i]}</span>
                  <span className="text-xs text-slate-400 w-16 flex-shrink-0">{["1st","2nd","3rd"][i]} Place</span>
                  <input type="number" className={inputCls} placeholder={["e.g. 2500","e.g. 1500","e.g. 1000"][i]}
                    value={form[`prize${i + 1}`]} onChange={set(`prize${i + 1}`)} min="0" />
                  {i > 0 && (
                    <button type="button" onClick={() => removePrize(i)}
                      className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                      <FiX size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Per Kill Bonus */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Per Kill Bonus (₹)</label>
            <input type="number" className={inputCls} placeholder="e.g. 10 per kill" value={form.perKill} onChange={set("perKill")} min="0" />
          </div>

          {/* Rules */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Rules / Description</label>
            <textarea
              className={`${inputCls} resize-none`} rows={3}
              placeholder="Enter tournament rules, room details format, etc."
              value={form.rules} onChange={set("rules")}
            />
          </div>

          {preview}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm font-bold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #ff3b3b, #a855f7)" }}>
              {loading ? "Publishing..." : "🏆 Publish Tournament"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function PlayerPrizeData() {
  const [players, setPlayers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [editing, setEditing]     = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [winnerModal, setWinnerModal] = useState(null);
  const [winnerForm, setWinnerForm]   = useState({ tournamentName: "", prizeAmount: "" });
  const [acting, setActing]           = useState(null);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const [usersRes, walletsRes, tournamentsRes] = await Promise.allSettled([
        API.get("/users/prize-data"),
        API.get("/wallet").catch(() => ({ data: [] })),
        API.get("/tournaments"),
      ]);
      const users      = usersRes.status === "fulfilled" ? usersRes.value.data : [];
      const tournaments = tournamentsRes.status === "fulfilled" ? tournamentsRes.value.data : [];
      // enrich each user with matches joined count
      const enriched = users.map(u => {
        const joined = tournaments.filter(t => t.joinedPlayers?.find(p => p.id === u._id?.toString())).length;
        return { ...u, matchesJoined: joined };
      });
      setPlayers(enriched);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchPlayers(); }, []);

  const filtered = players.filter(p => {
    const q = search.toLowerCase();
    return !q ||
      p.name?.toLowerCase().includes(q) ||
      p.ffUid?.includes(q) ||
      p.whatsapp?.includes(q) ||
      p.ffName?.toLowerCase().includes(q);
  });

  const updatePrize = async (id, prizeStatus, prizeNote) => {
    setActing(id);
    try {
      await API.patch(`/users/${id}/prize`, { prizeStatus, prizeNote });
      toast.success(`Status updated to ${prizeStatus}`);
      fetchPlayers();
    } catch { toast.error("Failed to update"); } finally { setActing(null); }
  };

  const saveWhatsapp = async (id, whatsapp) => {
    try {
      await API.patch(`/users/${id}/whatsapp-admin`, { whatsapp });
      toast.success("WhatsApp updated");
      setEditing(null);
      fetchPlayers();
    } catch { toast.error("Failed to update"); }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Clear WhatsApp & prize data for this user?")) return;
    try {
      await API.patch(`/users/${id}/whatsapp-admin`, { whatsapp: "" });
      await API.patch(`/users/${id}/prize`, { prizeStatus: "pending", prizeNote: "" });
      toast.success("Entry cleared");
      fetchPlayers();
    } catch { toast.error("Failed"); }
  };

  const markWinner = async () => {
    if (!winnerForm.tournamentName) return toast.error("Enter tournament name");
    if (!winnerForm.prizeAmount) return toast.error("Enter prize amount");
    setActing(winnerModal.id);
    try {
      await API.patch(`/users/${winnerModal.id}/mark-winner`, {
        tournamentName: winnerForm.tournamentName,
        prizeAmount: Number(winnerForm.prizeAmount),
      });
      toast.success(`🎉 ${winnerModal.name} marked as winner!`);
      setWinnerModal(null);
      setWinnerForm({ tournamentName: "", prizeAmount: "" });
      fetchPlayers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally { setActing(null); }
  };


  const exportCSV = () => {
    const headers = ["Name","Email","FF UID","In-Game Name","WhatsApp","Matches Joined","Prize Status","Note","Joined Date"];
    const rows = filtered.map(p => [
      p.name, p.email, p.ffUid || "—", p.ffName || "—",
      p.whatsapp, p.matchesJoined || 0,
      p.prizeStatus, p.prizeNote || "",
      new Date(p.createdAt).toLocaleDateString("en-IN")
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "prize-data.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const statusStyle = (s) => s === "paid"
    ? "bg-green-500/10 text-green-400 border-green-500/20"
    : s === "failed"
    ? "bg-red-500/10 text-red-400 border-red-500/20"
    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-white font-black text-lg flex items-center gap-2">
            <FiGift className="text-pink-400" /> Player Prize Data
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">{filtered.length} players with WhatsApp registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPlayers} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors">↻ Refresh</button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-slate-300 hover:border-white/20 hover:text-white transition-all">
            <FiDownload size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, UID, WhatsApp..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-sm outline-none focus:border-red-400 transition-all placeholder:text-white/20"
        />
      </div>

      {loading ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-8 h-8 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading prize data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <FiGift className="text-slate-700 text-5xl mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-bold">No players with WhatsApp yet</p>
          <p className="text-slate-600 text-xs mt-1">Players appear here after adding their WhatsApp number</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass rounded-2xl border border-white/5 overflow-hidden">

              {/* Card header */}
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between gap-3"
                style={{ background: "linear-gradient(135deg,rgba(255,59,59,0.07),rgba(168,85,247,0.07))" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white font-black flex-shrink-0">
                    {p.name?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-black text-sm truncate">{p.name}</p>
                    <p className="text-slate-500 text-xs truncate">{p.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusStyle(p.prizeStatus)}`}>
                    {p.prizeStatus}
                  </span>
                  {/* Actions */}
                  <button onClick={() => { setWinnerModal({ id: p._id, name: p.ffName || p.name }); setWinnerForm({ tournamentName: "", prizeAmount: "" }); }}
                    title="Mark as Winner"
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all">
                    🏆
                  </button>
                  <button onClick={() => updatePrize(p._id, "paid", p.prizeNote)} disabled={acting === p._id || p.prizeStatus === "paid"}
                    title="Mark Paid"
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-30">
                    <FiCheck size={13} />
                  </button>
                  <button onClick={() => updatePrize(p._id, "failed", p.prizeNote)} disabled={acting === p._id || p.prizeStatus === "failed"}
                    title="Mark Failed"
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-30">
                    <FiXCircle size={13} />
                  </button>
                  <button onClick={() => setNoteModal({ id: p._id, note: p.prizeNote || "" })}
                    title="Add Note"
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 text-slate-400 hover:text-white transition-all">
                    <FiEdit2 size={13} />
                  </button>
                  <button onClick={() => deleteEntry(p._id)}
                    title="Delete Entry"
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/5 text-slate-600 hover:text-red-400 transition-all">
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* WhatsApp */}
                <div className="col-span-2 sm:col-span-1 rounded-xl p-3 border border-green-500/20" style={{ background: "rgba(34,197,94,0.05)" }}>
                  <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><FaWhatsapp className="text-green-400" size={11} /> WhatsApp</p>
                  {editing?.id === p._id ? (
                    <div className="flex gap-1">
                      <input value={editing.whatsapp} onChange={e => setEditing({ ...editing, whatsapp: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-green-400" />
                      <button onClick={() => saveWhatsapp(p._id, editing.whatsapp)}
                        className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold">Save</button>
                      <button onClick={() => setEditing(null)}
                        className="px-2 py-1 rounded-lg bg-white/5 text-slate-400 text-xs">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <p className="text-green-400 font-bold text-sm flex-1">+{p.whatsapp}</p>
                      <button onClick={() => setEditing({ id: p._id, whatsapp: p.whatsapp })}
                        className="text-slate-600 hover:text-white transition-colors"><FiEdit2 size={11} /></button>
                    </div>
                  )}
                  {!editing && p.whatsapp && (
                    <a
                      href={`https://wa.me/${p.whatsapp}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 w-full justify-center"
                      style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
                      <FaWhatsapp size={12} /> Chat on WhatsApp
                    </a>
                  )}
                </div>

                {/* FF UID */}
                <div className="rounded-xl p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-slate-500 text-xs mb-1">FF UID</p>
                  <p className="text-orange-400 font-bold text-sm">{p.ffUid || "—"}</p>
                </div>

                {/* In-game Name */}
                <div className="rounded-xl p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-slate-500 text-xs mb-1">In-Game Name</p>
                  <p className="text-white font-bold text-sm">{p.ffName || "—"}</p>
                </div>

                {/* Matches Joined */}
                <div className="rounded-xl p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-slate-500 text-xs mb-1">Matches Joined</p>
                  <p className="text-cyan-400 font-black text-sm">{p.matchesJoined || 0}</p>
                </div>

                {/* Prize Status */}
                <div className="rounded-xl p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-slate-500 text-xs mb-1">Prize Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusStyle(p.prizeStatus)}`}>{p.prizeStatus}</span>
                </div>

                {/* Joined Date */}
                <div className="rounded-xl p-3 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-slate-500 text-xs mb-1">Joined Date</p>
                  <p className="text-slate-300 text-xs font-bold">{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>

                {/* Note */}
                {p.prizeNote && (
                  <div className="col-span-2 rounded-xl p-3 border border-yellow-500/20" style={{ background: "rgba(234,179,8,0.05)" }}>
                    <p className="text-slate-500 text-xs mb-1">Note</p>
                    <p className="text-yellow-400 text-xs">{p.prizeNote}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Winner Modal */}
      <AnimatePresence>
        {winnerModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setWinnerModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,8,2,0.98)", border: "1px solid rgba(250,204,21,0.3)" }}>
              <div className="px-6 py-4 border-b border-yellow-500/10 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg,rgba(250,204,21,0.1),rgba(234,179,8,0.05))" }}>
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="text-white font-black">Mark as Winner</h3>
                  <p className="text-yellow-400 text-xs">{winnerModal.name}</p>
                </div>
                <button onClick={() => setWinnerModal(null)} className="text-slate-500 hover:text-white ml-auto"><FiX size={16} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Tournament Name *</label>
                  <input
                    value={winnerForm.tournamentName}
                    onChange={e => setWinnerForm(f => ({ ...f, tournamentName: e.target.value }))}
                    placeholder="e.g. Free Fire Grand Clash #1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-yellow-400 transition-all placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Prize Amount (₹) *</label>
                  <input
                    type="number" value={winnerForm.prizeAmount}
                    onChange={e => setWinnerForm(f => ({ ...f, prizeAmount: e.target.value }))}
                    placeholder="e.g. 500"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-yellow-400 transition-all placeholder:text-white/20"
                  />
                </div>
                <div className="rounded-xl border border-yellow-500/20 p-3" style={{ background: "rgba(250,204,21,0.05)" }}>
                  <p className="text-yellow-400 text-xs font-bold mb-1">⚠️ This will instantly notify the player</p>
                  <p className="text-slate-400 text-xs">A winner popup will appear on their dashboard immediately.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setWinnerModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-bold">Cancel</button>
                  <button onClick={markWinner} disabled={!!acting}
                    className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#facc15,#f97316)" }}>
                    {acting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "🏆 Mark as Winner"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Modal */}
      <AnimatePresence>
        {noteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setNoteModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{ background: "rgba(10,5,5,0.98)", border: "1px solid rgba(255,59,59,0.2)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-black">Add Note</h3>
                <button onClick={() => setNoteModal(null)} className="text-slate-500 hover:text-white"><FiX size={16} /></button>
              </div>
              <textarea
                rows={3} value={noteModal.note}
                onChange={e => setNoteModal({ ...noteModal, note: e.target.value })}
                placeholder="e.g. Paid via GPay on 25 Jan..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-red-400 resize-none placeholder:text-white/20"
              />
              <div className="flex gap-3">
                <button onClick={() => setNoteModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-bold">Cancel</button>
                <button onClick={() => { updatePrize(noteModal.id, undefined, noteModal.note); setNoteModal(null); }}
                  className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm"
                  style={{ background: "linear-gradient(135deg,#ff3b3b,#a855f7)" }}>Save Note</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditModal({ tournament: t, onClose, onSave }) {
  const [form, setForm] = useState({
    name: t.name || "",
    mode: t.mode || t.matchType || "Solo",
    map: t.map || "Bermuda",
    date: t.date || "",
    time: t.time || "",
    closingTime: t.closingTime || "",
    entryFee: t.entryFee || "",
    prizeAmount: t.prizeAmount || "",
    totalSlots: t.totalSlots || 20,
    perKill: t.perKill || "",
    prize1st: t.prize1st || "",
    prize2nd: t.prize2nd || "",
    prize3rd: t.prize3rd || "",
    rules: t.rules || "",
    status: t.status || "upcoming",
    roomId: t.roomId || "",
    roomPassword: t.roomPassword || "",
    cancelReason: t.cancelReason || "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:border-cyan-400 focus:bg-cyan-400/5 transition-all placeholder:text-white/20";

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.time) return toast.error("Fill required fields");
    setLoading(true);
    try {
      const { data } = await API.put(`/tournaments/${t._id}`, {
        ...form,
        matchType: form.mode,
        entryFee: Number(form.entryFee),
        prizeAmount: Number(form.prizeAmount),
        totalSlots: Number(form.totalSlots),
      });
      toast.success("Tournament updated! ✅");
      onSave(data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update");
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl flex flex-col"
        style={{ background: "rgba(10,5,5,0.97)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "1.5rem", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/10 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,rgba(6,182,212,0.08),rgba(168,85,247,0.06))" }}>
          <div>
            <h2 className="text-white font-black text-lg flex items-center gap-2"><FiEdit2 className="text-cyan-400" /> Edit Tournament</h2>
            <p className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">{t.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><FiX size={20} /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">

          {/* Name */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Tournament Name *</label>
            <input className={inp} value={form.name} onChange={set("name")} placeholder="Tournament name" />
          </div>

          {/* Mode & Map */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Game Mode</label>
              <select className={inp} value={form.mode} onChange={set("mode")} style={{ background: "#0a0505" }}>
                {MODES.map(m => <option key={m} value={m} style={{ background: "#0a0505" }}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Map</label>
              <select className={inp} value={form.map} onChange={set("map")} style={{ background: "#0a0505" }}>
                {MAPS.map(m => <option key={m} value={m} style={{ background: "#0a0505" }}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Date, Time, Closing Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5"><FiCalendar className="inline mr-1" />Date *</label>
              <input type="date" className={inp} value={form.date} onChange={set("date")} style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5"><FiClock className="inline mr-1" />Start Time *</label>
              <input type="time" className={inp} value={form.time} onChange={set("time")} style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5"><FiClock className="inline mr-1" />Closing Time</label>
              <input type="time" className={inp} value={form.closingTime} onChange={set("closingTime")} style={{ colorScheme: "dark" }} />
            </div>
          </div>

          {/* Entry Fee, Prize, Slots, Per Kill */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Entry Fee (₹)</label>
              <input type="number" className={inp} value={form.entryFee} onChange={set("entryFee")} min="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Prize Pool (₹)</label>
              <input type="number" className={inp} value={form.prizeAmount} onChange={set("prizeAmount")} min="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Total Slots</label>
              <input type="number" className={inp} value={form.totalSlots} onChange={set("totalSlots")} min="2" max="100" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Per Kill (₹)</label>
              <input type="number" className={inp} value={form.perKill} onChange={set("perKill")} min="0" />
            </div>
          </div>

          {/* Prize Distribution */}
          <div className="grid grid-cols-3 gap-4">
            {[["prize1st","🥇 1st Prize"], ["prize2nd","🥈 2nd Prize"], ["prize3rd","🥉 3rd Prize"]].map(([k, label]) => (
              <div key={k}>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                <input type="number" className={inp} value={form[k]} onChange={set(k)} min="0" placeholder="₹" />
              </div>
            ))}
          </div>

          {/* Room ID & Password */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Room ID</label>
              <input className={inp} value={form.roomId} onChange={set("roomId")} placeholder="e.g. 123456" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Room Password</label>
              <input className={inp} value={form.roomPassword} onChange={set("roomPassword")} placeholder="e.g. ff2025" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
            <select className={inp} value={form.status} onChange={set("status")} style={{ background: "#0a0505" }}>
              {["upcoming","live","completed","cancelled"].map(s => (
                <option key={s} value={s} style={{ background: "#0a0505" }} className="capitalize">{s}</option>
              ))}
            </select>
          </div>

          {/* Cancel Reason */}
          {form.status === "cancelled" && (
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Cancel Reason</label>
              <input className={inp} value={form.cancelReason} onChange={set("cancelReason")} placeholder="Reason for cancellation" />
            </div>
          )}

          {/* Rules */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Rules / Description</label>
            <textarea className={`${inp} resize-none`} rows={3} value={form.rules} onChange={set("rules")} placeholder="Tournament rules..." />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-bold transition-all">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#06b6d4,#a855f7)" }}>
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : "✅ Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function WinnerHistoryPanel() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const fetchWinners = async () => {
    setLoading(true);
    try {
      const [notifRes, usersRes] = await Promise.allSettled([
        API.get("/notifications/winners"),
        API.get("/users/prize-data"),
      ]);
      const notifs = notifRes.status === "fulfilled" ? notifRes.value.data : [];
      const users  = usersRes.status  === "fulfilled" ? usersRes.value.data  : [];
      // enrich notifications with user details
      const enriched = notifs.map(n => {
        const user = users.find(u => u._id === n.userId || u._id?.toString() === n.userId);
        return { ...n, user };
      });
      setWinners(enriched);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchWinners(); }, []);

  const filtered = winners.filter(w => {
    const q = search.toLowerCase();
    return !q ||
      w.user?.name?.toLowerCase().includes(q) ||
      w.user?.ffUid?.includes(q) ||
      w.user?.ffName?.toLowerCase().includes(q) ||
      w.tournamentName?.toLowerCase().includes(q) ||
      w.user?.whatsapp?.includes(q);
  });

  const exportCSV = () => {
    const headers = ["Player Name", "Email", "FF UID", "In-Game Name", "WhatsApp", "Tournament", "Prize Amount", "Notified At", "Read"];
    const rows = filtered.map(w => [
      w.user?.name || "—", w.user?.email || "—",
      w.user?.ffUid || "—", w.user?.ffName || "—",
      w.user?.whatsapp ? `+${w.user.whatsapp}` : "—",
      w.tournamentName || "—",
      `₹${Number(w.prizeAmount).toLocaleString()}`,
      new Date(w.createdAt).toLocaleDateString("en-IN"),
      w.read ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "winner-history.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const totalPrize = filtered.reduce((s, w) => s + Number(w.prizeAmount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-white font-black text-lg flex items-center gap-2">
            <FiClock className="text-yellow-400" /> Winner History
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">{filtered.length} winners · Total prizes: ₹{totalPrize.toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchWinners} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors">↻ Refresh</button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 text-slate-300 hover:border-white/20 hover:text-white transition-all">
            <FiDownload size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total Winners",    value: winners.length,                                          color: "text-yellow-400",  bg: "rgba(250,204,21,0.07)",  border: "rgba(250,204,21,0.2)"  },
          { label: "Total Prize Paid", value: `₹${winners.reduce((s,w) => s + Number(w.prizeAmount||0),0).toLocaleString()}`, color: "text-green-400", bg: "rgba(34,197,94,0.07)", border: "rgba(34,197,94,0.2)" },
          { label: "Notifications Read", value: winners.filter(w => w.read).length,                   color: "text-cyan-400",    bg: "rgba(6,182,212,0.07)",   border: "rgba(6,182,212,0.2)"  },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center border" style={{ background: s.bg, borderColor: s.border }}>
            <p className={`font-black text-xl ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, UID, tournament, WhatsApp..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-sm outline-none focus:border-yellow-400 transition-all placeholder:text-white/20" />
      </div>

      {loading ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <span className="text-5xl block mb-3">🏆</span>
          <p className="text-slate-400 text-sm font-bold">No winner history yet</p>
          <p className="text-slate-600 text-xs mt-1">Winners will appear here after you mark them</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5" style={{ background: "rgba(250,204,21,0.04)" }}>
                  {["#", "Player", "FF UID / In-Game", "WhatsApp", "Tournament", "Prize", "Notified At", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((w, i) => (
                  <motion.tr key={w._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-yellow-400 font-black text-sm">#{i + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                          {w.user?.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{w.user?.name || "Unknown"}</p>
                          <p className="text-slate-500 text-xs">{w.user?.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-orange-400 font-bold text-xs">{w.user?.ffUid || "—"}</p>
                      <p className="text-slate-400 text-xs">{w.user?.ffName || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      {w.user?.whatsapp ? (
                        <a href={`https://wa.me/${w.user.whatsapp}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-green-400 font-bold text-xs hover:text-green-300 transition-colors">
                          <FaWhatsapp size={12} /> +{w.user.whatsapp}
                        </a>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-bold text-sm">{w.tournamentName || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-yellow-400 font-black text-sm">₹{Number(w.prizeAmount || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(w.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}<br />
                      {new Date(w.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                        w.read
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}>
                        {w.read ? "✓ Seen" : "⏳ Unseen"}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const recentPayments = [];

function DepositsPanel() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [preview, setPreview]   = useState(null);
  const [acting, setActing]     = useState(null);

  const fetch = async () => {
    try {
      const { data } = await API.get("/deposits/all");
      setDeposits(data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handle = async (id, action) => {
    setActing(id + action);
    try {
      await API.patch(`/deposits/${id}/${action}`);
      toast.success(`Deposit ${action}d!`);
      fetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to ${action}`);
    } finally { setActing(null); }
  };

  const pending  = deposits.filter(d => d.status === "pending").length;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-black text-lg flex items-center gap-2">
            <FiDollarSign className="text-yellow-400" /> Deposit Requests
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">{pending} pending · {deposits.length} total</p>
        </div>
        <button onClick={fetch} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors">↻ Refresh</button>
      </div>

      {loading ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-8 h-8 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading deposits...</p>
        </div>
      ) : deposits.length === 0 ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <FiDollarSign className="text-slate-700 text-5xl mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-bold">No deposit requests yet</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["User", "Amount", "Screenshot", "Date", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deposits.map((d, i) => (
                  <motion.tr key={d._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-bold">{d.userName || "—"}</p>
                      <p className="text-slate-500 text-xs">{d.userEmail || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-cyan-400 font-black text-sm">₹{Number(d.amount).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setPreview(d.screenshotUrl)}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
                        <FiEye size={13} /> View
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}<br />
                      {new Date(d.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                        d.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : d.status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {d.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handle(d._id, "approve")}
                            disabled={!!acting}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
                            {acting === d._id + "approve" ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheck size={12} />}
                            Approve
                          </button>
                          <button
                            onClick={() => handle(d._id, "reject")}
                            disabled={!!acting}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}>
                            {acting === d._id + "reject" ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiXCircle size={12} />}
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screenshot preview modal */}
      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setPreview(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} className="relative max-w-lg w-full">
              <button onClick={() => setPreview(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white z-10">
                <FiX size={14} />
              </button>
              <img src={preview} alt="Payment proof" className="w-full rounded-2xl object-contain max-h-[80vh]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboard() {
  const [active, setActive] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showClash, setShowClash] = useState(false);
  const [editTournament, setEditTournament] = useState(null);
  const { admin, users, banUser, logout } = useAuth();
  const { tournaments, loading: tLoading, add, remove } = useTournaments();
  const nav = useNavigate();

  // Auth guard — redirect to admin login if not authenticated
  useEffect(() => {
    if (!admin) nav("/admin-secret-login", { replace: true });
  }, [admin]);

  if (!admin) return null;

  const handleLogout = () => { logout(); toast.success("Admin logged out"); nav("/auth"); };

  const stats = [
    { label: "Total Users", value: users.length.toLocaleString(), icon: FiUsers, color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400", change: `${users.filter(u => u.status === "active").length} active` },
    { label: "Tournaments", value: tournaments.length.toString(), icon: GiTrophy, color: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/20 text-yellow-400", change: `${tournaments.filter(t => t.status === "live").length} live` },
    { label: "Total Prize Pool", value: `₹${tournaments.reduce((s, t) => s + Number(t.prizePool || 0), 0).toLocaleString()}`, icon: FiDollarSign, color: "from-green-500/20 to-green-500/5 border-green-500/20 text-green-400", change: "across all tournaments" },
    { label: "Pending Payouts", value: "₹0", icon: FiAlertCircle, color: "from-red-500/20 to-red-500/5 border-red-500/20 text-red-400", change: "0 requests" },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 ${sideOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ background: "rgba(10,5,5,0.97)", borderRight: "1px solid rgba(255,59,59,0.1)" }}>
        <div className="p-5 border-b border-red-500/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              <img src="/logo.jpg" alt="logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span
                className="font-black tracking-widest uppercase"
                style={{ color: "#facc15", fontSize: "1.3rem", textShadow: "0 0 20px rgba(250,204,21,0.5)" }}
              >
                WELCOME!! DINESH KUMAR SAH
              </span>
              <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>✦ THE CONTROLLER ROOM ✦</p>
            </div>
          </Link>
        </div>
        <div className="p-4 border-b border-red-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-sm">A</div>
            <div>
              <p className="text-white font-bold text-sm">Administrator</p>
              <p className="text-red-400 text-xs">{admin?.email || "admin@firefiregg.com"}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, id }) => (
            <button key={id} onClick={() => { setActive(id); setSideOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active === id ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
              <Icon className="text-base flex-shrink-0" />{label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-red-500/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {sideOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSideOpen(false)} />}

      <main className="flex-1 lg:ml-64 min-h-screen">
        <header className="sticky top-0 z-20 border-b px-4 sm:px-6 h-14 flex items-center justify-between"
          style={{ background: "rgba(10,5,5,0.97)", borderColor: "rgba(255,59,59,0.1)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSideOpen(true)} className="lg:hidden text-slate-400 hover:text-white"><FiMenu size={20} /></button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <h1 className="text-white font-bold capitalize text-sm">{active}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #ff3b3b, #a855f7)" }}>
              <FiPlus size={13} /> New Tournament
            </button>
            <span className="hidden sm:block px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">🔒 Admin</span>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {active === "deposits" ? (
            <DepositsPanel />
          ) : active === "prizedata" ? (
            <PlayerPrizeData />
          ) : active === "history" ? (
            <WinnerHistoryPanel />
          ) : (<>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`glass rounded-xl p-4 bg-gradient-to-br ${s.color} border card-hover`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs uppercase tracking-wider">{s.label}</span>
                  <s.icon className="text-base opacity-60" />
                </div>
                <p className="text-white font-black text-xl">{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.change}</p>
              </motion.div>
            ))}
          </div>

          {/* Tournaments Section */}
          <div className="mb-6">
            {/* Section Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <GiTrophy className="text-yellow-400" /> All Tournaments ({tournaments.length})
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setShowClash(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}>
                  ⚔️ Clash Squad 1v1
                </button>
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #ff3b3b, #a855f7)" }}>
                  <FiPlus size={13} /> Add Tournament
                </button>
              </div>
            </div>

            {tournaments.length === 0 ? (
              <div className="glass rounded-2xl border border-white/5 text-center py-16">
                <GiTrophy className="text-5xl text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm mb-3">No tournaments yet</p>
                <button onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #ff3b3b, #a855f7)" }}>
                  <FiPlus size={14} /> Create First Tournament
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {tournaments.map((t, i) => (
                  <motion.div key={t._id || t.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass rounded-2xl border border-white/5 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-3"
                      style={{ background: "linear-gradient(135deg, rgba(255,59,59,0.08), rgba(168,85,247,0.08))" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-base truncate">{t.name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{t.mode || t.matchType}</span>
                          {t.map && t.map !== "—" && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">{t.map}</span>}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                            t.status === "live" ? "bg-green-500/10 text-green-400 border-green-500/20 live-badge" :
                            t.status === "completed" ? "bg-slate-500/10 text-slate-400 border-slate-500/20" :
                            t.status === "cancelled" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          }`}>
                            {t.status === "live" ? "🔴 Live" : t.status === "completed" ? "✅ Done" : t.status === "cancelled" ? "❌ Cancelled" : "⏰ Upcoming"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditTournament(t)} className="text-slate-600 hover:text-cyan-400 transition-colors flex-shrink-0 mt-1">
                          <FiEdit2 size={15} />
                        </button>
                        <button onClick={() => remove(t._id || t.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 mt-1">
                          <FiTrash2 size={15} />
                        </button>
                        {t.status !== "cancelled" && (
                          <button onClick={async () => {
                            const reason = window.prompt("Cancel reason (optional):") ?? "";
                            try {
                              await API.post(`/tournaments/${t._id}/cancel`, { reason });
                              toast.success("Tournament cancelled. Refunds issued.");
                            } catch { toast.error("Failed to cancel"); }
                          }} className="text-slate-600 hover:text-orange-400 transition-colors flex-shrink-0 mt-1" title="Cancel & Refund">
                            <FiXCircle size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4">
                      {/* Date, Time, Countdown */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                        <FiCalendar className="text-cyan-400 flex-shrink-0" size={16} />
                        <div>
                          <p className="text-white text-sm font-bold">{t.date} &nbsp;·&nbsp; <span className="text-cyan-400">{t.time}</span></p>
                          <CountdownTimer date={t.date} time={t.time} />
                        </div>
                      </div>

                      {/* Financials */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl p-3 text-center" style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.15)" }}>
                          <p className="text-slate-400 text-xs mb-1">Entry Fee</p>
                          <p className="text-cyan-400 font-black text-sm">₹{Number(t.entryFee || 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl p-3 text-center" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.15)" }}>
                          <p className="text-slate-400 text-xs mb-1">Prize Pool</p>
                          <p className="text-yellow-400 font-black text-sm">₹{Number(t.prizeAmount || t.prizePool || 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl p-3 text-center" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
                          <p className="text-slate-400 text-xs mb-1">Per Kill</p>
                          <p className="text-green-400 font-black text-sm">{t.perKill ? `₹${t.perKill}` : "—"}</p>
                        </div>
                      </div>

                      {/* Slots */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs">Slots</span>
                        <span className="text-white font-bold text-sm">{t.slotsLeft ?? t.totalSlots} / {t.totalSlots || t.maxSlots} left</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5">
                        <div className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(((t.totalSlots || t.maxSlots) - (t.slotsLeft ?? 0)) / (t.totalSlots || t.maxSlots || 1)) * 100}%`,
                            background: "linear-gradient(90deg,#ff3b3b,#a855f7)"
                          }} />
                      </div>

                      {/* Prize Distribution */}
                      {(t.prize1st || t.prize2nd || t.prize3rd) && (
                        <div className="flex gap-2 flex-wrap">
                          {t.prize1st && <span className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">🥇 ₹{Number(t.prize1st).toLocaleString()}</span>}
                          {t.prize2nd && <span className="text-xs px-2 py-1 rounded-lg bg-slate-500/10 text-slate-300 border border-slate-500/20">🥈 ₹{Number(t.prize2nd).toLocaleString()}</span>}
                          {t.prize3rd && <span className="text-xs px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">🥉 ₹{Number(t.prize3rd).toLocaleString()}</span>}
                        </div>
                      )}

                      {/* Rules */}
                      {t.rules && (
                        <div className="rounded-xl p-3 bg-white/3 border border-white/5">
                          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Rules</p>
                          <p className="text-slate-300 text-xs leading-relaxed">{t.rules}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Player Lookup */}
          <div className="mb-6">
            <PlayerLookup />
          </div>

          {/* Users Table */}
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-white font-bold text-sm">All Users ({users.length})</h2>
              <span className="text-xs text-slate-500">{users.filter(u => u.status === "active").length} active · {users.filter(u => u.status === "banned").length} banned</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Player", "Email", "Via", "Joined", "Status", "Action"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u, i) => (
                    <motion.tr key={u._id || u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {u.avatar
                            ? <img src={u.avatar} className="w-7 h-7 rounded-full object-cover flex-shrink-0" alt={u.name} />
                            : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{u.name?.[0] || "?"}</div>}
                          <span className="text-white text-sm font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-sm">{u.email || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${u.method === "Google" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                          {u.method === "Google" ? "🔵 Google" : "✉️ Email"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-sm">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : u.joined || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${u.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => toast.success(`Viewing ${u.name}`)} className="text-slate-500 hover:text-cyan-400 transition-colors"><FiEye size={14} /></button>
                          <button onClick={() => { banUser(u._id || u.id); toast.success(u.status === "banned" ? `${u.name} unbanned` : `${u.name} banned`); }}
                            className={`transition-colors ${u.status === "banned" ? "text-green-400 hover:text-green-300" : "text-slate-500 hover:text-red-400"}`}>
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <div className="text-center py-10 text-slate-500 text-sm">No users yet</div>}
            </div>
          </div>
          </>)}
        </div>
      </main>

      <AnimatePresence>
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSave={add} />}
        {showClash && <ClashSquadModal onClose={() => setShowClash(false)} onSave={add} />}
        {editTournament && <EditModal tournament={editTournament} onClose={() => setEditTournament(null)} onSave={(updated) => { setEditTournament(null); }} />}
      </AnimatePresence>
    </div>
  );
}
