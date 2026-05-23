import { Trash2, CheckCircle } from 'lucide-react';
import { SeverityBadge, StatusBadge } from '../utils/badges';
import { getRowStyle } from '../utils/styles';

export default function IncidentCard({ incident, onUpdateStatus, onDelete, userRole }) {
  const isAdmin = userRole === 'ADMIN';
  const isDeleted = !!incident.deleted_at;

  return (
    <div
      className={`p-5 rounded-r-xl transition-all ${getRowStyle(incident.severity)} flex flex-col md:flex-row justify-between gap-4 md:items-center ${
        isDeleted ? 'opacity-50' : ''
      }`}
    >
      {/* Info Section */}
      <div className="space-y-2 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
          {isDeleted && (
            <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">
              TERHAPUS
            </span>
          )}
          <span className="text-xs text-gray-400 font-medium ml-2">
            ID: #{incident.id} • Dilaporkan oleh: {incident.created_by}
          </span>
        </div>
        <h3 className={`font-bold text-lg text-gray-800 ${isDeleted ? 'line-through' : ''}`}>
          {incident.title}
        </h3>
        <p className="text-gray-600 text-sm">{incident.description}</p>
      </div>

      {/* Actions Section — only if not deleted */}
      {!isDeleted && (
        <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0">
          {/* Status change buttons — Admin only */}
          {isAdmin && incident.status === 'OPEN' && (
            <button
              onClick={() => onUpdateStatus(incident.id, 'IN_PROGRESS')}
              className="px-3 py-1.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 rounded text-sm font-medium transition-colors"
            >
              Proses
            </button>
          )}
          {isAdmin && incident.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onUpdateStatus(incident.id, 'RESOLVED')}
              className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded text-sm font-medium transition-colors flex items-center gap-1"
            >
              <CheckCircle size={14} /> Selesai
            </button>
          )}

          {/* Delete button — Admin only */}
          {isAdmin && (
            <button
              onClick={() => onDelete(incident.id)}
              className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors ml-auto md:ml-2"
              title="Hapus Data (Soft Delete)"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
