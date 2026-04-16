import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { TournamentProvider } from "./context/TournamentContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/auth/AuthPage";
import Dashboard from "./pages/dashboard/Dashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import TournamentDetails from "./pages/TournamentDetails";
import WalletPage from "./pages/WalletPage";

// Pages with their own full sidebar layout — must NOT get global Navbar/Footer
const BARE_ROUTES = ["/dashboard", "/admin/dashboard", "/admin-secret-login"];

function AppRoutes() {
  const { pathname } = useLocation();
  const isBare = BARE_ROUTES.some(r => pathname.startsWith(r));

  return isBare ? (
    // No Navbar/Footer — dashboard pages manage their own layout
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin-secret-login" element={<AdminLoginPage />} />
    </Routes>
  ) : (
    // Global Navbar + Footer shell for all public pages
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pb-20 lg:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/tournament/:id" element={<TournamentDetails />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/tournaments" element={<div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-slate-400">Tournaments page coming soon</p></div>} />
          <Route path="/leaderboard" element={<div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-slate-400">Leaderboard page coming soon</p></div>} />
          <Route path="*" element={<div className="min-h-screen pt-24 flex items-center justify-center"><p className="text-slate-400">404 — Page not found</p></div>} />
        </Routes>
      </main>
      <Footer />
      <BottomNav />
    </div>
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
          <AppRoutes />
        </BrowserRouter>
      </TournamentProvider>
    </AuthProvider>
  );
}
