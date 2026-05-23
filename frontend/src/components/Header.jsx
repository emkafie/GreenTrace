import { Plus, Settings, LogOut, Shield, User } from 'lucide-react';

export default function Header({ user, onOpenModal, onOpenSettings, onLogout }) {
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-emerald-100/50 gap-4">
      {/* Top Accent Gradient Line matching the login page branding */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-green-500 via-emerald-600 to-teal-700" />

      {/* Left: Title (Enhanced to match brand colors without new logo graphics) */}
      <div className="pt-1 md:pt-0">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          <span className="bg-clip-text text-transparent bg-linear-to-r from-green-700 to-emerald-600">Greenfields</span> Attention Dashboard
        </h1>
        <p className="text-xs font-semibold tracking-wider text-emerald-700/80 uppercase mt-1">
          Incident &amp; Anomaly Monitoring System
        </p>
      </div>

      {/* Right: User info + Actions */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        {/* User badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-emerald-50/20 rounded-xl border border-emerald-100/40 text-sm">
          {isAdmin ? (
            <Shield size={15} className="text-amber-500" />
          ) : (
            <User size={15} className="text-emerald-600" />
          )}
          <span className="font-semibold text-gray-700">{user?.username}</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              isAdmin
                ? 'bg-amber-100 text-amber-800 border border-amber-200/50'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200/50'
            }`}
          >
            {user?.role}
          </span>
        </div>

        {/* Settings (Admin only) */}
        {isAdmin && (
          <button
            onClick={onOpenSettings}
            className="p-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl border border-transparent hover:border-emerald-100 transition-all duration-200 active:scale-95 cursor-pointer"
            title="Settings (Kata Kunci Anomali)"
          >
            <Settings size={20} />
          </button>
        )}

        {/* Create incident */}
        <button
          onClick={onOpenModal}
          className="bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 cursor-pointer text-sm"
        >
          <Plus size={18} className="stroke-[2.5]" /> Lapor Insiden
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-xl border border-transparent hover:border-red-100 transition-all duration-200 active:scale-95 cursor-pointer"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}

