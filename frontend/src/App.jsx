import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Filters from './components/Filters';
import IncidentList from './components/IncidentList';
import CreateIncidentModal from './components/CreateIncidentModal';
import ConfirmModal from './components/ConfirmModal';
import SettingsModal from './components/SettingsModal';
import {
  fetchIncidents as apiFetchIncidents,
  createIncident,
  updateIncidentStatus,
  deleteIncident,
} from './services/incidentApi';

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: '', status: '' });
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState(null);

  const isAdmin = user?.role === 'ADMIN';

  // ---- Data fetching ----
  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await apiFetchIncidents(filters, isAdmin && includeDeleted);
      setIncidents(data);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return; // Don't fetch if not logged in

    let ignore = false;
    const fetchData = async () => {
      try {
        const data = await apiFetchIncidents(filters, isAdmin && includeDeleted);
        if (!ignore) {
          setIncidents(data);
          setLoading(false);
        }
      } catch (error) {
        if (!ignore) {
          console.error('Gagal mengambil data:', error);
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      ignore = true;
    };
  }, [filters, includeDeleted, user]);

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

  const handleRequestUpdateStatus = (id, newStatus) => {
    const incident = incidents.find((inc) => inc.id === id);
    setConfirmAction({ action: newStatus, id, title: incident?.title || '' });
  };

  const handleRequestDelete = (id) => {
    const incident = incidents.find((inc) => inc.id === id);
    setConfirmAction({ action: 'DELETE', id, title: incident?.title || '' });
  };

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

  // ---- Auth loading state ----
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse text-lg">Memuat...</div>
      </div>
    );
  }

  // ---- Not logged in → show login page ----
  if (!user) {
    return <LoginPage />;
  }

  // ---- Logged in → show dashboard ----
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header
          user={user}
          onOpenModal={() => setShowModal(true)}
          onOpenSettings={() => setShowSettings(true)}
          onLogout={logout}
        />
        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isAdmin={isAdmin}
          includeDeleted={includeDeleted}
          onToggleDeleted={() => setIncludeDeleted(!includeDeleted)}
        />
        <IncidentList
          incidents={filteredIncidents}
          loading={loading}
          onUpdateStatus={handleRequestUpdateStatus}
          onDelete={handleRequestDelete}
          userRole={user.role}
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

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
