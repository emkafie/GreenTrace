import { Trash2, ArrowRight } from 'lucide-react';

const ACTION_CONFIG = {
  IN_PROGRESS: {
    icon: <ArrowRight size={24} className="text-purple-600" />,
    title: 'Proses Insiden?',
    message: 'Status akan berubah dari OPEN menjadi IN PROGRESS. Aksi ini menandakan insiden sedang ditangani.',
    confirmText: 'Ya, Proses',
    confirmClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    iconBg: 'bg-purple-100',
  },
  RESOLVED: {
    icon: <ArrowRight size={24} className="text-green-600" />,
    title: 'Selesaikan Insiden?',
    message: 'Status akan berubah dari IN PROGRESS menjadi RESOLVED. Pastikan insiden sudah benar-benar tertangani.',
    confirmText: 'Ya, Selesaikan',
    confirmClass: 'bg-green-600 hover:bg-green-700 text-white',
    iconBg: 'bg-green-100',
  },
  DELETE: {
    icon: <Trash2 size={24} className="text-red-600" />,
    title: 'Hapus Insiden?',
    message: 'Data insiden akan dihapus (soft delete). Anda tidak dapat membatalkan aksi ini.',
    confirmText: 'Ya, Hapus',
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    iconBg: 'bg-red-100',
  },
};

export default function ConfirmModal({ action, incidentTitle, onConfirm, onCancel }) {
  const config = ACTION_CONFIG[action];
  if (!config) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-[fadeIn_0.15s_ease-out]">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-full ${config.iconBg} flex items-center justify-center`}>
            {config.icon}
          </div>
        </div>

        {/* Title & message */}
        <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
          {config.title}
        </h3>
        {incidentTitle && (
          <p className="text-sm text-gray-800 font-medium text-center mb-1 truncate">
            &quot;{incidentTitle}&quot;
          </p>
        )}
        <p className="text-sm text-gray-500 text-center mb-6">
          {config.message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${config.confirmClass}`}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
