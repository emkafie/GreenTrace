import { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Filters from './components/Filters';
import IncidentList from './components/IncidentList';
import CreateIncidentModal from './components/CreateIncidentModal';
import ConfirmModal from './components/ConfirmModal';
import {
  fetchIncidents as apiFetchIncidents,
  createIncident,
  updateIncidentStatus,
  deleteIncident,
} from './services/incidentApi';

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: '', status: '' });
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState(null);
  // { action: 'IN_PROGRESS' | 'RESOLVED' | 'DELETE', id: number, title: string }

  // ---- Data fetching ----
  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await apiFetchIncidents(filters);
      setIncidents(data);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
      alert('Gagal terhubung ke server backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      try {
        const data = await apiFetchIncidents(filters);
        if (!ignore) {
          setIncidents(data);
          setLoading(false);
        }
      } catch (error) {
        if (!ignore) {
          console.error('Gagal mengambil data:', error);
          alert('Gagal terhubung ke server backend.');
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      ignore = true;
    };
  }, [filters]);

  // ---- Client-side search filtering ----
  const filteredIncidents = useMemo(() => {
    if (!searchQuery.trim()) return incidents;
    const query = searchQuery.toLowerCase();
    return incidents.filter(
      (inc) =>
        (inc.title && inc.title.toLowerCase().includes(query)) ||
        (inc.description && inc.description.toLowerCase().includes(query)) ||
        (inc.created_by && inc.created_by.toLowerCase().includes(query))
    );
  }, [incidents, searchQuery]);

  // ---- Event handlers ----
  const handleFilterChange = (newFilters) => {
    setLoading(true);
    setFilters(newFilters);
  };

  const handleCreate = async (formData) => {
    try {
      await createIncident(formData);
      setShowModal(false);
      loadIncidents();
    } catch (error) {
      console.error('Gagal membuat insiden:', error);
    }
  };

  // Instead of directly calling the API, open confirmation modal
  const handleRequestUpdateStatus = (id, newStatus) => {
    const incident = incidents.find((inc) => inc.id === id);
    setConfirmAction({ action: newStatus, id, title: incident?.title || '' });
  };

  const handleRequestDelete = (id) => {
    const incident = incidents.find((inc) => inc.id === id);
    setConfirmAction({ action: 'DELETE', id, title: incident?.title || '' });
  };

  // Actual confirm handler — called when user clicks "Ya, ..."
  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { action, id } = confirmAction;
    setConfirmAction(null);

    try {
      if (action === 'DELETE') {
        await deleteIncident(id);
      } else {
        await updateIncidentStatus(id, action);
      }
      loadIncidents();
    } catch (error) {
      console.error('Gagal melakukan aksi:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header onOpenModal={() => setShowModal(true)} />
        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <IncidentList
          incidents={filteredIncidents}
          loading={loading}
          onUpdateStatus={handleRequestUpdateStatus}
          onDelete={handleRequestDelete}
        />
      </div>

      {showModal && (
        <CreateIncidentModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          action={confirmAction.action}
          incidentTitle={confirmAction.title}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
