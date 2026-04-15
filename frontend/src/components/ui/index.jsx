// Badge
export function Badge({ children, color = "blue" }) {
  const colors = {
    blue: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
}

// Spinner
export function Spinner({ size = "md" }) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div className={`${sizes[size]} border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin`} />
  );
}

// Skeleton
export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

// Stat Card
export function StatCard({ label, value, icon: Icon, color = "blue" }) {
  const colors = {
    blue: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400",
    red: "from-red-500/20 to-red-500/5 border-red-500/20 text-red-400",
    green: "from-green-500/20 to-green-500/5 border-green-500/20 text-green-400",
  };
  return (
    <div className={`glass rounded-xl p-4 bg-gradient-to-br ${colors[color]} border card-hover`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="text-lg opacity-60" />}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

// Section Title
export function SectionTitle({ tag, title, subtitle }) {
  return (
    <div className="text-center mb-12">
      {tag && (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 mb-3 uppercase tracking-widest">
          {tag}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">{title}</h2>
      {subtitle && <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">{subtitle}</p>}
    </div>
  );
}

// Input Field wrapper
export function InputWrapper({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
      {children}
      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
