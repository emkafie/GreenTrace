import { useState, useEffect } from 'react';
import { X, Plus, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { getKeywords, updateKeywords } from '../services/settingsApi';

// Konfigurasi tier untuk 3 level severity
const TIERS = [
  {
    key: 'critical',
    label: '🔴 CRITICAL',
    description: 'Insiden fatal, mengancam nyawa, atau menghentikan seluruh pabrik',
    tagBg: 'bg-red-100',
    tagText: 'text-red-700',
    tagHover: 'hover:bg-red-200',
    borderColor: 'border-red-200',
    headerBg: 'bg-red-50',
  },
  {
    key: 'high',
    label: '🟠 HIGH',
    description: 'Insiden berat, mengganggu 1 line produksi, butuh penanganan hari ini',
    tagBg: 'bg-orange-100',
    tagText: 'text-orange-700',
    tagHover: 'hover:bg-orange-200',
    borderColor: 'border-orange-200',
    headerBg: 'bg-orange-50',
  },
  {
    key: 'medium',
    label: '🟡 MEDIUM',
    description: 'Insiden ringan/gejala awal, menurunkan efisiensi tapi pabrik tetap jalan',
    tagBg: 'bg-amber-100',
    tagText: 'text-amber-700',
    tagHover: 'hover:bg-amber-200',
    borderColor: 'border-amber-200',
    headerBg: 'bg-amber-50',
  },
];

export default function SettingsModal({ onClose }) {
  const [keywordGroups, setKeywordGroups] = useState({
    critical: [],
    high: [],
    medium: [],
  });
  const [newKeywords, setNewKeywords] = useState({ critical: '', high: '', medium: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch keywords on mount
  useEffect(() => {
    let ignore = false;
    const loadKeywords = async () => {
      try {
        const data = await getKeywords();
        if (!ignore) {
          setKeywordGroups({
            critical: data.critical || [],
            high: data.high || [],
            medium: data.medium || [],
          });
        }
      } catch (err) {
        if (!ignore) setError('Gagal memuat keywords: ' + err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadKeywords();
    return () => { ignore = true; };
  }, []);

  const handleAddKeyword = (tierKey) => {
    const trimmed = newKeywords[tierKey].trim().toLowerCase();
    if (!trimmed) return;
    if (keywordGroups[tierKey].includes(trimmed)) {
      setError(`Keyword "${trimmed}" sudah ada di ${tierKey.toUpperCase()}.`);
      return;
    }
    setKeywordGroups({
      ...keywordGroups,
      [tierKey]: [...keywordGroups[tierKey], trimmed],
    });
    setNewKeywords({ ...newKeywords, [tierKey]: '' });
    setError('');
  };

  const handleRemoveKeyword = (tierKey, index) => {
    setKeywordGroups({
      ...keywordGroups,
      [tierKey]: keywordGroups[tierKey].filter((_, i) => i !== index),
    });
  };

  const handleKeyDown = (e, tierKey) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword(tierKey);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateKeywords(keywordGroups);
      onClose();
    } catch (err) {
      setError('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalKeywords = keywordGroups.critical.length + keywordGroups.high.length + keywordGroups.medium.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Keyword Deteksi Anomali</h2>
            <p className="text-sm text-gray-500">Kelola kata kunci per level severity ({totalKeywords} total)</p>
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
            {/* Tier Sections */}
            <div className="space-y-4 mb-6">
              {TIERS.map((tier) => (
                <div
                  key={tier.key}
                  className={`rounded-lg border ${tier.borderColor} overflow-hidden`}
                >
                  {/* Tier Header */}
                  <div className={`${tier.headerBg} px-4 py-2.5`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-gray-800">
                          {tier.label}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({keywordGroups[tier.key].length} keyword)
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{tier.description}</p>
                  </div>

                  {/* Tier Body */}
                  <div className="p-3 bg-white">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] mb-2">
                      {keywordGroups[tier.key].length === 0 && (
                        <span className="text-xs text-gray-400 italic py-1">Belum ada keyword</span>
                      )}
                      {keywordGroups[tier.key].map((kw, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 ${tier.tagBg} ${tier.tagText} rounded-full text-xs font-medium`}
                        >
                          {kw}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(tier.key, index)}
                            className={`ml-0.5 p-0.5 rounded-full ${tier.tagHover} transition-colors`}
                            title="Hapus keyword"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Add input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className={`flex-1 border ${tier.borderColor} rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-offset-0 transition-all`}
                        placeholder={`Tambah keyword ${tier.key}...`}
                        value={newKeywords[tier.key]}
                        onChange={(e) => setNewKeywords({ ...newKeywords, [tier.key]: e.target.value })}
                        onKeyDown={(e) => handleKeyDown(e, tier.key)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddKeyword(tier.key)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Plus size={14} /> Tambah
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
              <AlertCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                Sistem memeriksa kata kunci dari prioritas tertinggi ke terendah.
                Jika judul/deskripsi insiden mengandung keyword <strong>CRITICAL</strong>, maka langsung ditandai CRITICAL,
                meskipun juga cocok dengan keyword tier di bawahnya. Jika tidak ada keyword yang cocok, severity otomatis menjadi <strong className="text-gray-500">LOW</strong>.
              </p>
            </div>

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
