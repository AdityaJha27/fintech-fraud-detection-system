import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Sidebar — Main navigation component
 * Includes Profile Modal on avatar click
 * Logo click → Landing page redirect
 */
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/simulator', label: 'Simulator', icon: '⚡' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/ml-models', label: 'ML Models', icon: '🤖' },
    { path: '/reports', label: 'Reports', icon: '📄' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* ── Profile Modal ─────────────────────────────── */}
      {showProfile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
              <h2 className="text-base font-black text-white">My Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg transition-all duration-200 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Avatar + Name */}
            <div className="flex flex-col items-center py-8 px-6 border-b border-slate-800">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-black text-white mb-4 shadow-lg shadow-blue-900/40">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <p className="text-xl font-black text-white">{user?.name}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">{user?.role || 'Analyst'}</p>
              <span className="mt-3 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full font-bold">
                ● Active
              </span>
            </div>

            {/* Profile Details */}
            <div className="px-6 py-4 space-y-3">
              {[
                { label: 'Full Name', value: user?.name || '—', icon: '👤' },
                { label: 'Email', value: user?.email || '—', icon: '📧' },
                { label: 'Role', value: user?.role || 'Analyst', icon: '🏷️' },
                { label: 'System Access', value: 'FinTech FDS — Full Access', icon: '🔐' },
                { label: 'Member Since', value: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }), icon: '📅' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">{item.label}</span>
                  </div>
                  <span className="text-xs text-slate-300 font-medium text-right max-w-[140px] truncate">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setShowProfile(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
              >
                Close
              </button>
              <button
                onClick={() => { setShowProfile(false); handleLogout(); }}
                className="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold py-2.5 rounded-xl transition-all text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ───────────────────────────────────── */}
      <div className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">

        {/* Logo — click to go to landing */}
        <div
          onClick={() => navigate('/')}
          className="px-6 py-5 border-b border-slate-800 transition-all duration-200 hover:bg-slate-800/50 cursor-pointer"
        >
          <h1 className="text-lg font-black text-blue-500 uppercase tracking-tight">
            FinTech FDS
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
            Fraud Detection System
          </p>
        </div>

        {/* User Info — click to open profile */}
        <div
          onClick={() => setShowProfile(true)}
          className="px-6 py-4 border-b border-slate-800 transition-all duration-200 hover:bg-slate-800/50 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 group-hover:bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 group-hover:scale-110">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase">{user?.role || 'Analyst'}</p>
            </div>
            <span className="text-slate-600 group-hover:text-slate-400 text-xs transition-colors">
              ›
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 hover:translate-x-1"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>

      </div>
    </>
  );
};

export default Sidebar;