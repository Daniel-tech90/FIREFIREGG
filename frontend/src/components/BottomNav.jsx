import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiAward, FiUser, FiLogIn } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const tabs = [
  { label: "Home",        to: "/",            icon: FiHome,  protected: false },
  { label: "Tournaments", to: "/tournaments", icon: FiAward, protected: true  },
  { label: "Login",       to: "/auth",        icon: FiLogIn, protected: false },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hide on dashboard / admin routes
  if (["/dashboard", "/admin"].some(r => pathname.startsWith(r))) return null;

  const handleClick = (e, tab) => {
    if (tab.protected && !user) {
      e.preventDefault();
      toast.error("Please login to access this page 🔒");
      navigate("/auth");
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ background: "rgba(10,10,20,0.97)", borderTop: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {tabs.map(({ label, to, icon: Icon, protected: prot }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={(e) => handleClick(e, { protected: prot })}
              className="flex flex-col items-center gap-1 flex-1 py-1.5 rounded-xl transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                active
                  ? "bg-cyan-400/15 border border-cyan-400/30"
                  : "hover:bg-white/5"
              }`}>
                <Icon size={20} className={active ? "text-cyan-400" : "text-slate-500"} />
              </div>
              <span className={`text-xs font-bold ${active ? "text-cyan-400" : "text-slate-500"}`}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Profile / Dashboard shortcut */}
        <Link
          to={user ? "/dashboard" : "/auth?tab=register"}
          className="flex flex-col items-center gap-1 flex-1 py-1.5 rounded-xl transition-all"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            pathname === "/dashboard" ? "bg-cyan-400/15 border border-cyan-400/30" : "hover:bg-white/5"
          }`}>
            {user
              ? <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white text-xs font-black">{user.name?.[0] || "P"}</div>
              : <FiUser size={20} className="text-slate-500" />
            }
          </div>
          <span className={`text-xs font-bold ${pathname === "/dashboard" ? "text-cyan-400" : "text-slate-500"}`}>
            {user ? "Dashboard" : "Register"}
          </span>
        </Link>
      </div>
    </nav>
  );
}
