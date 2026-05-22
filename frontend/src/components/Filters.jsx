import { Filter, Search } from 'lucide-react';

export default function Filters({ filters, onFilterChange, searchQuery, onSearchChange }) {
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
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
          placeholder="Cari judul atau deskripsi..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter dropdowns */}
      <div className="flex items-center gap-2 text-gray-600 font-medium">
        <Filter size={18} /> Filters:
      </div>
      <select
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
        value={filters.severity}
        onChange={(e) => handleChange('severity', e.target.value)}
      >
        <option value="">Semua Severity</option>
        <option value="CRITICAL">Critical</option>
        <option value="LOW">Low</option>
      </select>
      <select
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
      >
        <option value="">Semua Status</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
      </select>
    </div>
  );
}
