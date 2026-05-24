import { useState, useEffect } from 'react';
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
  const [filters, setFilters] = useState({ severity: '', status: '', area: '' });
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState(null);

  const isAdmin = user?.role === 'ADMIN';

  // ---- Data fetching ----
  const loadIncidents = async () => {
    setLoading(true);
    try {
      const { data, pagination: pagData } = await apiFetchIncidents(
        filters,
        isAdmin && includeDeleted,
        page,
        10,
        searchQuery
      );
      setIncidents(data);
      setPagination(pagData);
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
        const { data, pagination: pagData } = await apiFetchIncidents(
          filters,
          isAdmin && includeDeleted,
          page,
          10,
          searchQuery
        );
        if (!ignore) {
          setIncidents(data);
          setPagination(pagData);
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
  }, [filters, includeDeleted, page, searchQuery, user, isAdmin]);

  // ---- Event handlers ----
  const handleFilterChange = (newFilters) => {
    setLoading(true);
    setPage(1);
    setFilters(newFilters);
  };

  const handleSearchChange = (newQuery) => {
    setPage(1);
    setSearchQuery(newQuery);
  };

  const handleToggleDeleted = () => {
    setPage(1);
    setIncludeDeleted(!includeDeleted);
  };

  const handleCreate = async (formData) => {
    try {
      await createIncident(formData);
      setShowModal(false);
      setPage(1); // Reset to first page to see the newly created incident
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
          onSearchChange={handleSearchChange}
          isAdmin={isAdmin}
          includeDeleted={includeDeleted}
          onToggleDeleted={handleToggleDeleted}
        />
        <IncidentList
          incidents={incidents}
          loading={loading}
          onUpdateStatus={handleRequestUpdateStatus}
          onDelete={handleRequestDelete}
          userRole={user.role}
        />

        {/* Pagination controls */}
        {!loading && pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200 gap-4">
            <div className="text-sm text-gray-500">
              Menampilkan <span className="font-semibold text-gray-700">{Math.min((pagination.currentPage - 1) * pagination.limit + 1, pagination.totalItems)}</span>
              {' '}-{' '}
              <span className="font-semibold text-gray-700">{Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}</span>
              {' '}dari{' '}
              <span className="font-semibold text-gray-700">{pagination.totalItems}</span> insiden
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.currentPage <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
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
