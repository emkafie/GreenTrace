import { Plus } from 'lucide-react';

export default function Header({ onOpenModal }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Greenfields Attention Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Incident &amp; Anomaly Monitoring System
        </p>
      </div>
      <button
        onClick={onOpenModal}
        className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
      >
        <Plus size={18} /> Lapor Insiden
      </button>
    </div>
  );
}
