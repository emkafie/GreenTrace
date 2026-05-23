import { useState } from 'react';
import { LogIn, Eye, EyeOff, AlertCircle, Leaf } from 'lucide-react';
import { login as apiLogin } from '../services/authApi';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await apiLogin(form.username, form.password);
      login(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa username dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col lg:flex-row">
      {/* Left side: Quote & Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-linear-to-br from-emerald-950 via-green-900 to-teal-950 text-white p-16 flex-col justify-between relative overflow-hidden min-h-screen shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-15 pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500 rounded-full blur-3xl opacity-15 pointer-events-none"></div>
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-size[:20px_20px] pointer-events-none"></div>

        {/* Top Header / Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
            <Leaf size={22} className="text-green-400" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-wide bg-clip-text text-transparent bg-linear-to-r from-white to-emerald-200">
              GreenTrace
            </span>
            <span className="block text-[10px] text-emerald-300 font-semibold tracking-wider uppercase">
              Incident & Anomaly Monitoring
            </span>
          </div>
        </div>

        {/* Quote Section */}
        <div className="my-auto relative z-10 max-w-md xl:max-w-lg">
          <span className="text-9xl font-serif text-emerald-400/10 absolute -top-16 -left-6 select-none pointer-events-none">“</span>
          <blockquote className="space-y-6 relative z-10">
            <p className="text-2xl xl:text-3xl font-medium leading-relaxed text-emerald-50/90">
              Mendeteksi anomali lebih awal bukan hanya soal menjaga sistem tetap berjalan, melainkan tentang langkah nyata dalam melacak dan menjaga kelestarian lingkungan kita.
            </p>
            <footer className="flex items-center gap-3 mt-6">
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
                G
              </div>
              <div>
                <cite className="not-italic font-semibold text-white block">
                  GreenTrace Platform
                </cite>
                <span className="text-xs text-emerald-400">
                  Real-time Environmental Intelligence
                </span>
              </div>
            </footer>
          </blockquote>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-emerald-300/40">
          <span>&copy; {new Date().getFullYear()} Greenfields Indonesia.</span>
          <span>v1.0</span>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-md">
          {/* Logo / Branding (Mobile only) */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
              <Leaf size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">GreenTrace</h1>
            <p className="text-gray-500 mt-1">Incident & Anomaly Monitoring System</p>
          </div>

          <div className="mb-8 hidden lg:block text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Selamat Datang</h2>
            <p className="mt-2 text-sm text-gray-600">
              Silakan masuk untuk mengakses panel pemantauan anomali.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Masuk ke Dashboard</h2>
            <p className="text-sm text-gray-500 mb-6">Gunakan akun yang telah diberikan.</p>

            {/* Error alert */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-gray-900"
                  placeholder="Masukkan username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-11 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-gray-900"
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <span className="animate-pulse">Memverifikasi...</span>
                ) : (
                  <>
                    <LogIn size={18} /> Masuk
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer hint */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Greenfields Attention Dashboard &bull; v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
