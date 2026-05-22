import { useState } from 'react';

export default function CreateIncidentModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    created_by: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ title: '', description: '', created_by: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Lapor Insiden Baru</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul Insiden
            </label>
            <input
              required
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Contoh: Mesin A mati total"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi &amp; Kronologi
            </label>
            <textarea
              required
              rows="4"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Ceritakan detail kejadian... (Sistem akan otomatis mendeteksi kata kunci bahaya)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">
              Hint: Coba ketik &quot;bocor&quot; atau &quot;mati total&quot;
              untuk tes anomali.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Pelapor
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Nama Anda"
              value={formData.created_by}
              onChange={(e) =>
                setFormData({ ...formData, created_by: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Simpan Laporan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
