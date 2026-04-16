import { useState, useEffect, useRef } from "react";
import { FiClock } from "react-icons/fi";
import API from "../api/axios";

// Singleton server offset — fetched once, shared across all instances
let serverOffset = 0;
let offsetFetched = false;

async function fetchOffset() {
  if (offsetFetched) return;
  try {
    const { data } = await API.get("/tournaments/server-time");
    serverOffset = data.now - Date.now();
    offsetFetched = true;
  } catch { offsetFetched = true; }
}

fetchOffset();

export default function CountdownTimer({ date, time, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!date || !time) return;
    expiredRef.current = false;

    const calc = () => {
      const serverNow = Date.now() + serverOffset;
      const target = new Date(`${date}T${time}`).getTime();
      const diff = target - serverNow;

      if (diff <= 0) {
        setTimeLeft(null);
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpire?.();
        }
        return;
      }

      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ d, h, m, s, diff });
    };

    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [date, time]);

  if (!timeLeft) return null;

  const { d, h, m, s, diff } = timeLeft;
  const urgent = diff < 3600000;   // < 1 hour
  const soon   = diff < 86400000;  // < 1 day
  const fmt = (n) => String(n).padStart(2, "0");

  const color = urgent
    ? "text-red-500"
    : soon
    ? "text-red-400"
    : "text-red-500";

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-black ${color} ${urgent ? "animate-pulse" : ""}`}
      style={{ textShadow: urgent ? "0 0 8px rgba(239,68,68,0.9)" : "0 0 8px rgba(239,68,68,0.7)" }}>
      <FiClock size={10} />
      {d > 0 ? `${d}d ${fmt(h)}h ${fmt(m)}m ${fmt(s)}s` : `${fmt(h)}:${fmt(m)}:${fmt(s)}`}
    </span>
  );
}
