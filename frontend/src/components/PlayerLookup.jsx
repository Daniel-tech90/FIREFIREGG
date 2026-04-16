import { useState, useEffect } from "react";
import { FiSearch, FiX, FiTarget } from "react-icons/fi";
import CountdownTimer from "./CountdownTimer";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const SERVERS = ["IND", "SG", "BR", "US", "ID", "TW", "TH", "VN", "ME", "PK", "BD", "CIS", "RU"];
const kd  = (k, d) => d > 0 ? (k / d).toFixed(2) : k;
const wr  = (w, g) => g > 0 ? ((w / g) * 100).toFixed(1) + "%" : "0%";
const hs  = (h, k) => k > 0 ? ((h / k) * 100).toFixed(1) + "%" : "0%";
const lastSeen = (ts) => ts ? new Date(Number(ts) * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const cleanBio = (s) => s?.replace(/\[.*?\]/g, "").trim() || "";

export default function PlayerLookup({ tournaments = [], loadingTournaments = false, initialUid = "", onViewAll }) {
  const [uid, setUid]       = useState(initialUid || "");
  const [server, setServer] = useState("IND");
  const [player, setPlayer] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ff_player_cache")) || null; } catch { return null; }
  });
  const [stats, setStats]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("ff_stats_cache")) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [tab, setTab]       = useState("solo");
  const { setFFProfile }    = useAuth();

  useEffect(() => {
    if (initialUid && !player) {
      fetchPlayer(initialUid);
    } else if (initialUid && player) {
      // restore ffName from cache on page load
      const name = player?.basicinfo?.nickname;
      if (name) setFFProfile(initialUid, name);
    }
  }, [initialUid]);

  const fetchPlayer = async (id) => {
    setLoading(true); setError("");
    try {
      const [pRes, sRes] = await Promise.allSettled([
        API.get(`/garena/player/${id}?server=${server}`),
        API.get(`/garena/stats/${id}?server=${server}&gamemode=br&matchmode=CAREER`),
      ]);
      if (pRes.status === "fulfilled") {
        const data = pRes.value.data;
        setPlayer(data);
        localStorage.setItem("ff_player_cache", JSON.stringify(data));
        const name = data?.basicinfo?.nickname;
        if (name) setFFProfile(id, name);
      } else setError("Player not found");
      if (sRes.status === "fulfilled") {
        const sdata = sRes.value.data?.data;
        setStats(sdata);
        localStorage.setItem("ff_stats_cache", JSON.stringify(sdata));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "";
      if (!err?.response || err?.code === "ERR_NETWORK") {
        setError("Game API is offline. Please try again later.");
      } else {
        setError(msg || "Player not found");
      }
    }
    finally { setLoading(false); }
  };

  const lookup = (e) => { e.preventDefault(); if (uid.trim()) fetchPlayer(uid.trim()); };

  const info   = player?.basicinfo;
  const clan   = player?.clanbasicinfo;
  const pet    = player?.petinfo;
  const social = player?.socialinfo;
  const credit = player?.creditscoreinfo;

  const TABS = { solo: stats?.solostats, duo: stats?.duostats, squad: stats?.quadstats };
  const s = TABS[tab];

  return (
    <div className="glass rounded-2xl border border-white/5 p-5 w-full">

      {/* Title */}
      <div className="mb-3">
        <h3 className="font-black text-lg" style={{ background: "linear-gradient(90deg,#f97316,#ef4444,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          🔍 Enter your Free Fire UID
        </h3>
        <p className="text-slate-500 text-xs mt-0.5">Search any player's stats, rank & guild info</p>
      </div>

      {/* Search */}
      <form onSubmit={lookup} className="flex gap-2 mb-3">
        <select value={server} onChange={e => setServer(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-slate-300 text-xs outline-none focus:border-orange-400"
          style={{ background: "#0a0505" }}>
          {SERVERS.map(s => <option key={s} value={s} style={{ background: "#0a0505" }}>{s}</option>)}
        </select>
        <input className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none focus:border-orange-400 transition-all placeholder:text-white/20"
          placeholder="Enter UID..." value={uid} onChange={e => setUid(e.target.value)} />
        <button type="submit" disabled={loading || !uid.trim()}
          className="px-3 py-2 rounded-lg text-white font-bold text-sm disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSearch size={15} />}
        </button>
      </form>

      {error && <p className="flex items-center gap-1.5 text-red-400 text-xs mb-3"><FiX size={12} />{error}</p>}

      {/* Player Card — compact */}
      {info && (
        <div className="rounded-xl border border-orange-400/15 overflow-hidden mb-3" style={{ background: "rgba(249,115,22,0.04)" }}>

          {/* Row 1: Avatar + Name + Level */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black flex-shrink-0">
              {info.nickname?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm truncate">{info.nickname}</p>
              <p className="text-slate-500 text-xs">{info.accountid} · {info.region} · {info.releaseversion}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-yellow-400 font-black">Lv.{info.level}</p>
              <p className="text-slate-500 text-xs">{Number(info.exp || 0).toLocaleString()} XP</p>
            </div>
          </div>

          {/* Row 2: 6 key stats inline */}
          <div className="grid grid-cols-6 divide-x divide-white/5 border-b border-white/5">
            {[
              { l: "BR Pts",  v: info.rankingpoints  || "—", c: "text-cyan-400"   },
              { l: "CS Pts",  v: info.csrankingpoints || "—", c: "text-purple-400" },
              { l: "Likes",   v: Number(info.liked || 0).toLocaleString(), c: "text-pink-400" },
              { l: "Credit",  v: credit?.creditscore  || "—", c: "text-green-400"  },
              { l: "Pet Lv",  v: pet?.level ? `${pet.level}` : "—", c: "text-orange-400" },
              { l: "Last On", v: lastSeen(info.lastloginat), c: "text-slate-300"   },
            ].map(({ l, v, c }) => (
              <div key={l} className="py-2 text-center">
                <p className={`font-black text-xs ${c}`}>{v}</p>
                <p className="text-slate-600 text-xs">{l}</p>
              </div>
            ))}
          </div>

          {/* Row 3: Guild + Mode + Bio in one line */}
          <div className="flex items-center gap-3 px-4 py-2 text-xs flex-wrap">
            {clan?.clanname && <span className="text-orange-400 font-bold">🏰 {clan.clanname} (Lv.{clan.clanlevel})</span>}
            {social?.modeprefer && <span className="text-slate-400">· {social.modeprefer.replace("MODEPREFER", "")} mode</span>}
            {social?.signature && <span className="text-slate-500 truncate max-w-xs">{cleanBio(social.signature)}</span>}
          </div>

          {/* Row 4: BR Stats tabs */}
          {stats && (
            <div className="border-t border-white/5">
              {/* Tab switcher */}
              <div className="flex border-b border-white/5">
                {["solo", "duo", "squad"].map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      tab === t ? "text-orange-400 border-b-2 border-orange-400" : "text-slate-600 hover:text-slate-400"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
              {/* Stats grid */}
              {s?.gamesplayed ? (
                <div className="grid grid-cols-4 divide-x divide-white/5 px-0">
                  {[
                    { l: "Games", v: s.gamesplayed?.toLocaleString() },
                    { l: "Wins",  v: s.wins?.toLocaleString(),        c: "text-yellow-400" },
                    { l: "Kills", v: s.kills?.toLocaleString(),       c: "text-red-400"    },
                    { l: "K/D",   v: kd(s.kills, s.detailedstats?.deaths), c: "text-cyan-400" },
                    { l: "Win%",  v: wr(s.wins, s.gamesplayed),       c: "text-green-400"  },
                    { l: "HS%",   v: hs(s.detailedstats?.headshotKills, s.kills), c: "text-orange-400" },
                    { l: "Best",  v: s.detailedstats?.highestKills || "—", c: "text-purple-400" },
                    { l: "Dmg",   v: (Number(s.detailedstats?.damage || 0) / 1000).toFixed(0) + "K" },
                  ].map(({ l, v, c = "text-white" }) => (
                    <div key={l} className="py-2 text-center">
                      <p className={`font-black text-xs ${c}`}>{v}</p>
                      <p className="text-slate-600 text-xs">{l}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-xs text-center py-3">No {tab} stats</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Tournaments */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-base" style={{ background: "linear-gradient(90deg,#06b6d4,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            🏆 Upcoming Tournaments
          </h3>
          {onViewAll && (
            <button onClick={onViewAll} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
              View All →
            </button>
          )}
        </div>
        {loadingTournaments ? (
          <div className="text-center py-4"><div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto" /></div>
        ) : tournaments.length === 0 ? (
          <p className="text-slate-600 text-xs text-center py-4">No tournaments yet. Check back soon!</p>
        ) : (
          <div className="space-y-2">
            {tournaments.slice(0, 4).map(t => (
              <div key={t._id} onClick={onViewAll}
                className="flex items-center gap-3 rounded-xl border border-white/5 px-4 py-3 cursor-pointer hover:border-cyan-500/30 hover:bg-white/3 transition-all"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <FiTarget className="text-cyan-400 flex-shrink-0" size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{t.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-400 text-xs">{t.matchType || t.mode}</span>
                    <CountdownTimer date={t.date} time={t.time} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-yellow-400 font-black text-sm">₹{Number(t.prizeAmount || t.prizePool || 0).toLocaleString()}</p>
                  <p className={`text-xs font-bold mt-0.5 ${t.status === "live" ? "text-green-400" : t.status === "completed" ? "text-slate-500" : "text-cyan-400"}`}>
                    {t.status === "live" ? "🔴 Live" : t.status === "completed" ? "✅ Done" : "⏰ Soon"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
