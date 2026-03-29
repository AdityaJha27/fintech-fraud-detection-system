import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

/**
 * StatCard — Reusable stat display component
 */
const StatCard = ({ title, value, subtitle, color }) => {
  const colors = {
    blue: 'border-blue-500 text-blue-400',
    red: 'border-red-500 text-red-400',
    green: 'border-green-500 text-green-400',
    yellow: 'border-yellow-500 text-yellow-400',
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 border-t-4 ${colors[color]} rounded-xl p-6 hover:bg-slate-800/80 hover:-translate-y-1 hover:shadow-xl cursor-pointer transition-all duration-200`}>
      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">{title}</p>
      <p className={`text-3xl font-black ${colors[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-600 mt-1">{subtitle}</p>}
    </div>
  );
};

/**
 * InvestigationModal — Shows detailed ML analysis for a flagged account
 */
const InvestigationModal = ({ accountId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/investigate/${accountId}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [accountId]);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-black text-white">Account Investigation</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{accountId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg transition-all duration-200 font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="text-blue-400 text-sm animate-pulse text-center py-8">
              Running ML Analysis...
            </div>
          )}

          {data && !loading && (
            <div className="space-y-4">

              {/* Risk Level */}
              <div className={`p-4 rounded-xl border ${
                data.risk_level?.includes('CRITICAL')
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
                  Risk Assessment
                </p>
                <p className={`text-xl font-black ${
                  data.risk_level?.includes('CRITICAL') ? 'text-red-400' : 'text-green-400'
                }`}>
                  {data.risk_level}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  ML Confidence: <span className="font-bold text-white">{data.risk_index}</span>
                </p>
              </div>

              {/* Transaction Details */}
              <div className="bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">
                  Transaction Details
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Account ID', value: data.account_id },
                    { label: 'Transaction Type', value: data.transaction_type },
                    { label: 'Total Volume', value: data.amount },
                    { label: 'Ground Truth', value: data.ground_truth },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-700 pb-2">
                      <span className="text-xs text-slate-500 uppercase">{item.label}</span>
                      <span className={`text-xs font-bold ${
                        item.label === 'Ground Truth' && item.value === 'Confirmed Fraud'
                          ? 'text-red-400' : 'text-white'
                      }`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* XAI Report */}
              <div className="bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">
                  Explainable AI — Risk Factors
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Amount Weight', value: data.xai_report?.amount_weight },
                    { label: 'Velocity Weight', value: data.xai_report?.velocity_weight },
                    { label: 'Overdraft Detected', value: data.xai_report?.flagged_by_system ? 'Yes' : 'No' },
                    { label: 'Model Used', value: data.xai_report?.model_used || 'RF + XGBoost' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-700 pb-2">
                      <span className="text-xs text-slate-500 uppercase">{item.label}</span>
                      <span className={`text-xs font-bold ${
                        item.value === 'Critical' ? 'text-red-400' :
                        item.value === 'High' ? 'text-orange-400' :
                        item.value === 'Medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {String(item.value || '—')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ML Reason */}
              <div className="bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">
                  ML Detection Reason
                </p>
                <p className="text-sm text-slate-300 italic">"{data.reason}"</p>
              </div>

              {/* Dark Web */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                data.darkweb_correlation?.includes('Found')
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-green-500/10 border-green-500/20'
              }`}>
                <span className="text-lg">🌐</span>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Dark Web Correlation</p>
                  <p className={`text-sm font-bold ${
                    data.darkweb_correlation?.includes('Found') ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {data.darkweb_correlation}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition-all duration-200 text-sm"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition-all duration-200 text-sm active:scale-95"
            >
              Restrict Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

/**
 * Dashboard — Main overview page
 * Stats fetched from backend — updated model metrics
 * RF: F1=0.91, AUC=0.9993 | XGB: F1=0.89, AUC=0.9994
 */
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await fetch('http://localhost:8000/api/stats');
        const statsData = await statsRes.json();
        setStats(statsData);

        const clustersRes = await fetch('http://localhost:8000/api/fraud-clusters');
        const clustersData = await clustersRes.json();

        const generatedAlerts = clustersData.nodes
          .filter(n => n.color === '#ef4444')
          .map(n => ({
            id: n.id,
            label: n.label,
            severity: 'High',
            reason: n.reason || 'Random Forest + XGBoost: Fraud Pattern Detected'
          }));

        setAlerts(generatedAlerts);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      {selectedAccount && (
        <InvestigationModal
          accountId={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}

      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time fraud detection overview</p>
        </div>

        {/* Stats — from backend /api/stats */}
        {loading ? (
          <div className="text-blue-400 text-sm animate-pulse mb-8">Loading stats...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Transactions" value={stats?.total_transactions || '—'} subtitle="PaySim Dataset" color="blue" />
            <StatCard title="Fraud Cases" value={stats?.fraud_cases || '—'} subtitle="Confirmed fraud" color="red" />
            <StatCard title="RF F1 Score" value={stats?.rf_f1 || '—'} subtitle="Recall: 1.00" color="green" />
            <StatCard title="ROC-AUC" value={stats?.rf_auc || '—'} subtitle="Random Forest" color="yellow" />
          </div>
        )}

        {/* Model Performance — updated widths */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 transition-all duration-200 hover:border-slate-700">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
            Model Performance
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Random Forest F1</span>
                <span className="text-green-400 font-bold">{stats?.rf_f1}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '91%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>XGBoost F1</span>
                <span className="text-blue-400 font-bold">{stats?.xgb_f1}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '89%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all duration-200 hover:border-slate-700">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
              Live Fraud Alerts — Real PaySim Accounts
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-600">Updated {lastUpdated}</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Refreshes every 10s — Click any alert to investigate
          </p>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                onClick={() => setSelectedAccount(alert.id)}
                className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl cursor-pointer hover:bg-red-500/10 hover:border-red-500/40 transition-all duration-200 group"
              >
                <div>
                  <p className="text-sm font-bold font-mono text-white">{alert.id}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{alert.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                    {alert.severity}
                  </span>
                  <span className="text-slate-600 group-hover:text-slate-400 transition-colors text-xs">
                    Investigate →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;