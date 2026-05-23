import { Plus, Settings, LogOut, Shield, User } from 'lucide-react';

export default function Header({ user, onOpenModal, onOpenSettings, onLogout }) {
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200 gap-4">
      {/* Left: Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Greenfields Attention Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Incident &amp; Anomaly Monitoring System
        </p>
      </div>

      {/* Right: User info + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* User badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
          {isAdmin ? (
            <Shield size={14} className="text-amber-500" />
          ) : (
            <User size={14} className="text-blue-500" />
          )}
          <span className="font-medium text-gray-700">{user?.username}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-bold ${
              isAdmin
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {user?.role}
          </span>
        </div>

        {/* Settings (Admin only) */}
        {isAdmin && (
          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
            title="Settings (Kata Kunci Anomali)"
          >
            <Settings size={20} />
          </button>
        )}

        {/* Create incident */}
        <button
          onClick={onOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Lapor Insiden
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
