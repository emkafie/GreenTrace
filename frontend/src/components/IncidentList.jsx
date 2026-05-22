import IncidentCard from './IncidentCard';

export default function IncidentList({ incidents, loading, onUpdateStatus, onDelete }) {
  if (loading) {
    return <div className="text-center py-10 text-gray-500">Memuat data...</div>;
  }

  if (incidents.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-500">
        Tidak ada data insiden yang ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
