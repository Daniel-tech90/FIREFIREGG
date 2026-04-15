import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ff_user")) || null; } catch { return null; }
  });
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ff_admin")) || null; } catch { return null; }
  });
  const [users, setUsers] = useState([]);
  const [ffUid, setFfUid] = useState(() => localStorage.getItem("ff_uid") || "");
  const [ffName, setFfName] = useState(() => localStorage.getItem("ff_ingame_name") || "");

  // Fetch all registered users from DB
  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/users");
      setUsers(data);
    } catch { }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (user) localStorage.setItem("ff_user", JSON.stringify(user));
    else localStorage.removeItem("ff_user");
  }, [user]);

  useEffect(() => {
    if (admin) localStorage.setItem("ff_admin", JSON.stringify(admin));
    else localStorage.removeItem("ff_admin");
  }, [admin]);

  const loginUser = async (userData) => {
    const newUser = {
      name: userData.name || "Player",
      email: userData.email || "",
      avatar: userData.avatar || "",
      method: userData.avatar ? "Google" : "Email",
    };
    try {
      const { data } = await API.post("/users/register", newUser);
      const localUser = { ...data, id: data._id };
      setUser(localUser);
      fetchUsers();
    } catch {
      // fallback to local only
      const localUser = { ...newUser, id: userData.email || Date.now(), status: "active" };
      setUser(localUser);
    }
  };

  const loginAdmin = (adminData) => setAdmin(adminData);

  const setFFProfile = (uid, inGameName) => {
    setFfUid(uid);
    setFfName(inGameName);
    localStorage.setItem("ff_uid", uid);
    localStorage.setItem("ff_ingame_name", inGameName);
  };

  const logout = () => {
    setUser(null);
    setAdmin(null);
    setFfUid("");
    setFfName("");
    localStorage.removeItem("ff_user");
    localStorage.removeItem("ff_admin");
    localStorage.removeItem("ff_uid");
    localStorage.removeItem("ff_ingame_name");
    localStorage.removeItem("ff_player_cache");
    localStorage.removeItem("ff_stats_cache");
  };

  const banUser = async (id) => {
    try {
      const { data } = await API.patch(`/users/${id}/ban`);
      setUsers(prev => prev.map(u => (u._id === id || u.id === id) ? { ...u, status: data.status } : u));
    } catch {
      setUsers(prev => prev.map(u => (u._id === id || u.id === id) ? { ...u, status: u.status === "banned" ? "active" : "banned" } : u));
    }
  };

  return (
    <AuthContext.Provider value={{ user, admin, users, ffUid, ffName, setFFProfile, loginUser, loginAdmin, logout, banUser, fetchUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
