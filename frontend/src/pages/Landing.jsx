import { useNavigate } from 'react-router-dom';

/**
 * Landing — Public home page
 * Showcases platform features and model performance stats
 * Entry point for unauthenticated users
 * Updated: New model metrics — RF F1: 0.91, AUC: 0.9993
 */
const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-black text-blue-500 uppercase tracking-tight">
            FinTech FDS
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            Fraud Detection System
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-all duration-200 hover:border-slate-400 hover:bg-slate-800"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-900/40"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-400 border border-blue-500/30 bg-blue-500/10 px-4 py-1 rounded-full mb-6 transition-all duration-200 hover:bg-blue-500/20 hover:border-blue-400/60 cursor-default">
          AI-Powered Fraud Detection
        </span>
        <h2 className="text-5xl font-black mb-6 leading-tight">
          Detect Financial Fraud
          <br />
          <span className="text-blue-500">in Real-Time</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mb-10">
          Enterprise-grade fraud detection powered by XGBoost and Random Forest.
          Trained on 6.3 million real financial transactions — SMOTE balanced,
          no data leakage, SHAP explainability.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50"
          >
            Start Detecting Fraud
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 border border-slate-700 hover:border-slate-400 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 hover:bg-slate-800/50"
          >
            Sign In
          </button>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 px-8 py-12 border-y border-slate-800 bg-slate-900/50">
        {[
          { label: "Transactions Analyzed", value: "6,362,620" },
          { label: "Random Forest F1", value: "91%" },
          { label: "ROC-AUC Score", value: "99.93%" },
          { label: "Fraud Cases Detected", value: "8,213" },
        ].map((stat, i) => (
          <div
            key={i}
            className="text-center p-4 rounded-xl transition-all duration-200 hover:bg-slate-800/50 cursor-default"
          >
            <div className="text-3xl font-black text-blue-400 transition-all duration-200 hover:text-blue-300">
              {stat.value}
            </div>
            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="px-8 py-20">
        <h3 className="text-2xl font-black text-center mb-12">
          Why FinTech FDS?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: "Ensemble ML Models",
              desc: "XGBoost and Random Forest work together — when models disagree, transaction is flagged for manual review.",
              icon: "🤖"
            },
            {
              title: "Explainable AI",
              desc: "Every prediction comes with SHAP-based explanation — understand exactly why a transaction was flagged as fraud.",
              icon: "🔍"
            },
            {
              title: "Real-Time Analysis",
              desc: "Analyze any transaction instantly. Get fraud probability scores from both models with Recall of 1.00 — zero fraud missed.",
              icon: "⚡"
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:border-blue-500/40 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-blue-900/20 hover:scale-[1.02]"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Model Highlights */}
      <section className="px-8 pb-20">
        <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">
            Model Highlights — v2.0
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Class Imbalance', value: 'SMOTE Fixed', color: 'text-green-400' },
              { label: 'Data Leakage', value: 'Eliminated', color: 'text-green-400' },
              { label: 'Recall Score', value: '1.00', color: 'text-green-400' },
              { label: 'Explainability', value: 'SHAP Values', color: 'text-blue-400' },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 bg-slate-800/50 rounded-xl transition-all duration-200 hover:bg-slate-800">
                <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
                <p className="text-xs text-slate-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-8 py-6 text-center text-slate-600 text-sm">
        FinTech Fraud Detection System — Trained on PaySim Dataset — 6.3M Real Transactions
      </footer>

    </div>
  );
};

export default Landing;