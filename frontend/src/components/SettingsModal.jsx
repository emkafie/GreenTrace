import { useState, useEffect } from 'react';
import { X, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { getKeywords, updateKeywords } from '../services/settingsApi';

export default function SettingsModal({ onClose }) {
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch keywords on mount
  useEffect(() => {
    let ignore = false;
    const loadKeywords = async () => {
      try {
        const data = await getKeywords();
        if (!ignore) setKeywords(data);
      } catch (err) {
        if (!ignore) setError('Gagal memuat keywords: ' + err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadKeywords();
    return () => { ignore = true; };
  }, []);

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed) return;
    if (keywords.includes(trimmed)) {
      setError('Keyword sudah ada dalam daftar.');
      return;
    }
    setKeywords([...keywords, trimmed]);
    setNewKeyword('');
    setError('');
  };

  const handleRemoveKeyword = (index) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateKeywords(keywords);
      onClose();
    } catch (err) {
      setError('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Settings</h2>
            <p className="text-sm text-gray-500">Kelola kata kunci deteksi anomali</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4 text-sm">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="ml-2">Memuat keywords...</span>
          </div>
        ) : (
          <>
            {/* Keyword Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daftar Kata Kunci Bahaya ({keywords.length})
              </label>
              <div className="flex flex-wrap gap-2 min-h-[48px] p-3 bg-gray-50 rounded-lg border border-gray-200">
                {keywords.length === 0 && (
                  <span className="text-sm text-gray-400 italic">Belum ada keyword</span>
                )}
                {keywords.map((kw, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium group"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(index)}
                      className="ml-0.5 p-0.5 rounded-full hover:bg-red-200 transition-colors"
                      title="Hapus keyword"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Add Keyword */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                placeholder="Tambah keyword baru..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <Plus size={16} /> Tambah
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 mb-4">
              Jika judul atau deskripsi insiden mengandung salah satu kata kunci di atas, 
              sistem akan otomatis menandai insiden sebagai <strong>CRITICAL</strong> dan anomali.
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
