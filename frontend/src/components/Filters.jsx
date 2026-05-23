import { useState, useEffect } from 'react';
import { Filter, Search, Trash2 } from 'lucide-react';

export default function Filters({
  filters,
  onFilterChange,
  searchQuery,
  onSearchChange,
  isAdmin,
  includeDeleted,
  onToggleDeleted,
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync local search state with parent if search query is reset externally
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce logic: trigger parent callback after user stops typing for 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(localSearch);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch, onSearchChange]);

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors text-gray-900"
          placeholder="Cari judul atau deskripsi..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      {/* Filter dropdowns */}
      <div className="flex items-center gap-2 text-gray-600 font-medium">
        <Filter size={18} /> Filters:
      </div>
      <select
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-gray-800"
        value={filters.severity}
        onChange={(e) => handleChange('severity', e.target.value)}
      >
        <option value="">Semua Severity</option>
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
      <select
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-gray-800"
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
      >
        <option value="">Semua Status</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>

      {/* Admin only: show deleted toggle */}
      {isAdmin && (
        <button
          type="button"
          onClick={onToggleDeleted}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
            includeDeleted
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
          title="Tampilkan / Sembunyikan data yang sudah dihapus"
        >
          <Trash2 size={14} />
          {includeDeleted ? 'Sembunyikan Terhapus' : 'Tampilkan Terhapus'}
        </button>
      )}
    </div>
  );
}
