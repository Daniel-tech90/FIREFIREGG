import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import API from "../api/axios";

const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTournaments = useCallback(async () => {
    try {
      const { data } = await API.get("/tournaments");
      setTournaments(data);
    } catch (err) {
      console.error("Failed to fetch tournaments:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always fetch from API first — independent of socket
    fetchTournaments();

    // Socket for real-time updates — failures won't affect the fetch above
    const socket = io("http://localhost:5000", {
      autoConnect: true,
      reconnectionAttempts: 2,
      timeout: 3000,
    });
    socket.on("tournament:created", (t) => setTournaments(prev => [t, ...prev]));
    socket.on("tournament:updated", (t) => setTournaments(prev => prev.map(x => x._id === t._id ? t : x)));
    socket.on("tournament:deleted", ({ id }) => setTournaments(prev => prev.filter(x => x._id !== id)));

    return () => socket.disconnect();
  }, [fetchTournaments]);

  // ── Admin: create ─────────────────────────────────────────────────────────
  const createTournament = useCallback(async (data) => {
    const { data: t } = await API.post("/tournaments", {
      ...data,
      slotsLeft: Number(data.totalSlots),
    });
    return t;
  }, []);

  // ── Admin: update ─────────────────────────────────────────────────────────
  const updateTournament = useCallback(async (id, patch) => {
    const { data: t } = await API.put(`/tournaments/${id}`, patch);
    return t;
  }, []);

  // ── Admin: delete ─────────────────────────────────────────────────────────
  const deleteTournament = useCallback(async (id) => {
    await API.delete(`/tournaments/${id}`);
  }, []);

  // ── Admin: change status ──────────────────────────────────────────────────
  const setStatus = useCallback(async (id, status) => {
    const { data: t } = await API.patch(`/tournaments/${id}/status`, { status });
    return t;
  }, []);

  // ── User: join tournament ─────────────────────────────────────────────────
  const joinTournament = useCallback(async (tournamentId, userId, userName, userEmail, entryFee) => {
    // Deduct wallet first
    await API.post("/wallet/deduct", {
      userId,
      userName,
      amount: entryFee,
      label: "Tournament entry fee",
    });
    // Then join
    const { data: t } = await API.post(`/tournaments/${tournamentId}/join`, {
      userId,
      userName,
      userEmail,
    });
    return t;
  }, []);

  // ── Wallet ────────────────────────────────────────────────────────────────
  const getWallet = useCallback(async (userId) => {
    const { data } = await API.get(`/wallet/${userId}`);
    return data;
  }, []);

  const addMoney = useCallback(async (userId, userName, amount) => {
    const { data } = await API.post("/wallet/add", { userId, userName, amount });
    return data;
  }, []);

  const withdrawMoney = useCallback(async (userId, amount) => {
    const { data } = await API.post("/wallet/withdraw", { userId, amount });
    return data;
  }, []);

  return (
    <TournamentContext.Provider value={{
      tournaments,
      loading,
      fetchTournaments,
      createTournament,
      updateTournament,
      deleteTournament,
      setStatus,
      joinTournament,
      getWallet,
      addMoney,
      withdrawMoney,
    }}>
      {children}
    </TournamentContext.Provider>
  );
}

export const useTournaments = () => useContext(TournamentContext);
