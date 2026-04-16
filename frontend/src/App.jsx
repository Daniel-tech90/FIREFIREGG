import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { TournamentProvider } from "./context/TournamentContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/auth/AuthPage";
import Dashboard from "./pages/dashboard/Dashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import TournamentDetails from "./pages/TournamentDetails";
import WalletPage from "./pages/WalletPage";

// Routes that have their own full-page sidebar layout — no global Navbar/Footer
const NO_SHELL = ["/dashboard", "/admin/dashboard", "/admin-secret-login"];

function Shell({ children }) {
  const { pathname } = useLocation();
  const hide = NO_SHELL.some(p => pathname.startsWith(p));
  if (hide) return <>{children}</>;
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Layout() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin-secret-login" element={<AdminLoginPage />} />
        <Route path="/tournament/:id" element={<TournamentDetails />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/tournaments" element={<div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-slate-400">Tournaments page coming soon</p></div>} />
        <Route path="/leaderboard" element={<div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-slate-400">Leaderboard page coming soon</p></div>} />
        <Route path="*" element={<div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-slate-400">404 — Page not found</p></div>} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0f0f1a",
                color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#00d4ff", secondary: "#0f0f1a" } },
              error: { iconTheme: { primary: "#ff3b3b", secondary: "#0f0f1a" } },
            }}
          />
          <Layout />
        </BrowserRouter>
      </TournamentProvider>
    </AuthProvider>
  );
}
