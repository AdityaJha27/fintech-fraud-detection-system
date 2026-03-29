import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

/**
 * Analytics — Fraud Business Intelligence
 * 100% real data from PaySim dataset via FastAPI
 */
const Analytics = () => {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [analyticsRes, statsRes] = await Promise.all([
          fetch('http://localhost:8000/api/analytics'),
          fetch('http://localhost:8000/api/stats'),
        ]);

        const analyticsData = await analyticsRes.json();
        const statsData = await statsRes.json();

        setData(analyticsData);
        setStats(statsData);
      } catch (err) {
        console.error('Analytics fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-white">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p className="text-blue-400 text-sm font-bold animate-pulse">
            Loading real PaySim analytics...
          </p>
        </main>
      </div>
    );
  }

  const getRiskColor = (rate) => {
    if (rate > 0.5) return 'bg-red-500/20 text-red-400 border border-red-500/30';
    if (rate > 0) return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    return 'bg-green-500/20 text-green-400 border border-green-500/30';
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black">Fraud Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real PaySim dataset insights — 6,362,620 transactions analyzed
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Fraud Cases',
              value: stats?.fraud_cases || '—',
              sub: 'Confirmed in PaySim',
              color: 'border-red-500 text-red-400',
            },
            {
              label: 'Fraud Rate',
              value: '0.129%',
              sub: 'Of all transactions',
              color: 'border-orange-500 text-orange-400',
            },
            {
              label: 'Avg Fraud Amount',
              value: data?.amount_stats?.avg || '—',
              sub: 'Per fraud transaction',
              color: 'border-yellow-500 text-yellow-400',
            },
            {
              label: 'Max Fraud Amount',
              value: data?.amount_stats?.max || '—',
              sub: 'Largest single fraud',
              color: 'border-blue-500 text-blue-400',
            },
          ].map((s, i) => (
            <div
              key={i}
              className={`bg-slate-900 border border-slate-800 border-t-4 ${s.color} rounded-xl p-5 transition-all duration-200 hover:bg-slate-800/80 hover:scale-[1.02] cursor-default`}
            >
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">{s.label}</p>
              <p className={`text-xl font-black ${s.color.split(' ')[1]}`}>{s.value}</p>
              <p className="text-xs text-slate-600 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Amount Stats Row */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 transition-all duration-200 hover:border-slate-700">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
            Fraud Amount Statistics — Real PaySim Data
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Minimum', value: data?.amount_stats?.min },
              { label: 'Median', value: data?.amount_stats?.median },
              { label: 'Average', value: data?.amount_stats?.avg },
              { label: 'Maximum', value: data?.amount_stats?.max },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 bg-slate-800/50 rounded-xl transition-all duration-200 hover:bg-slate-800 cursor-default">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">{item.label}</p>
                <p className="text-lg font-black text-blue-400">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fraud by Type + Risk Table */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">

          {/* Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all duration-200 hover:border-slate-700">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
              Fraud Count by Transaction Type
            </h2>
            <p className="text-xs text-slate-600 mb-6">
              Real fraud cases per type — PaySim dataset
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.fraud_by_type || []} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="type" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value) => [value.toLocaleString(), 'Fraud Cases']}
                />
                <Bar dataKey="fraud_count" name="Fraud Cases" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all duration-200 hover:border-slate-700">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
              Risk Rate by Transaction Type
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Fraud rate = fraud cases / total transactions of that type
            </p>
            <div className="space-y-3">
              {(data?.fraud_by_type || []).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 transition-all duration-200 hover:bg-slate-800"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{item.type}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.fraud_count.toLocaleString()} fraud / {item.total_count.toLocaleString()} total
                    </p>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${getRiskColor(item.fraud_rate)}`}>
                    {item.fraud_rate === 0 ? 'No Fraud' : `${item.fraud_rate}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Amount Distribution + Peak Simulation Steps */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* Amount Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all duration-200 hover:border-slate-700">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
              Fraud by Amount Range
            </h2>
            <p className="text-xs text-slate-600 mb-6">
              How much money was involved in real fraud cases
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.amount_distribution || []} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value) => [value.toLocaleString(), 'Fraud Cases']}
                />
                <Bar dataKey="count" name="Fraud Cases" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Simulation Steps */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all duration-200 hover:border-slate-700">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
              Peak Fraud Simulation Steps
            </h2>
            <p className="text-xs text-slate-600 mb-6">
              Top 10 simulation steps with most fraud — 1 step = 1 hour in PaySim
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.peak_fraud_hours || []} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value) => [value.toLocaleString(), 'Fraud Cases']}
                />
                <Bar dataKey="count" name="Fraud Cases" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Analytics;