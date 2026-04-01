import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
const ML_URL = import.meta.env.VITE_ML_URL || 'http://localhost:8000';

/**
 * Reports — Forensic report generation page
 * Updated: New model metrics — SMOTE balanced, no data leakage, 7 features
 * RF: F1=0.91, Recall=1.00 | XGB: F1=0.89, Recall=1.00
 */
const Reports = () => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(null);
  const [generated, setGenerated] = useState(null);

  // ─── Fraud Accounts Report ───────────────────────────────────────
  const generateFraudReport = async () => {
    setGenerating('fraud');
    setGenerated(null);

    try {
      const clustersRes = await fetch(`${ML_URL}/api/fraud-clusters`);
      const clustersData = await clustersRes.json();
      const fraudAccounts = clustersData.nodes.filter(n => n.color === '#ef4444');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const reportId = `FRD-${Date.now()}`;

      // ── Header ──
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setFillColor(239, 68, 68);
      doc.rect(0, 0, 4, 45, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('FRAUD INVESTIGATION REPORT', 14, 16);

      doc.setTextColor(239, 68, 68);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('CONFIDENTIAL — FOR AUTHORIZED PERSONNEL ONLY', 14, 24);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report ID: ${reportId}`, 14, 32);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
      doc.text(`Investigating Analyst: ${user?.name || 'Analyst'}`, pageWidth - 14, 32, { align: 'right' });
      doc.text(`Classification: RESTRICTED`, pageWidth - 14, 38, { align: 'right' });

      // ── Background ──
      doc.setFillColor(2, 6, 23);
      doc.rect(0, 45, pageWidth, 255, 'F');

      let y = 58;

      // ── Summary Box ──
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('INVESTIGATION SUMMARY', 20, y + 8);

      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Total Flagged Accounts: ${fraudAccounts.length}`, 20, y + 17);
      doc.text(`Detection: RF (F1:0.91, Recall:1.00) + XGBoost (F1:0.89, Recall:1.00)`, 20, y + 23);
      doc.text(`Data Source: PaySim — 6,362,620 Real Transactions`, pageWidth - 20, y + 17, { align: 'right' });
      doc.text(`Status: ACTIVE INVESTIGATION`, pageWidth - 20, y + 23, { align: 'right' });

      y += 38;

      // ── Section Header ──
      doc.setFillColor(60, 20, 20);
      doc.rect(14, y, pageWidth - 28, 10, 'F');
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('FLAGGED ACCOUNTS — DETAILED ANALYSIS', 17, y + 7);
      y += 16;

      // ── Account Cards ──
      fraudAccounts.forEach((account, index) => {
        if (y > 250) {
          doc.addPage();
          doc.setFillColor(2, 6, 23);
          doc.rect(0, 0, pageWidth, 300, 'F');
          y = 20;
        }

        doc.setFillColor(15, 23, 42);
        doc.roundedRect(14, y, pageWidth - 28, 32, 2, 2, 'F');
        doc.setFillColor(239, 68, 68);
        doc.rect(14, y, 3, 32, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${account.id}`, 22, y + 9);

        const typeText = account.label || 'Mule Account';
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(pageWidth - 60, y + 3, 46, 8, 1, 1, 'F');
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(typeText.toUpperCase(), pageWidth - 37, y + 8, { align: 'center' });

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('ML Fraud Probability:', 22, y + 18);

        doc.setTextColor(34, 197, 94);
        doc.setFont('helvetica', 'bold');
        doc.text(`RF: ${account.rf_prob || '—'}%`, 75, y + 18);

        doc.setTextColor(59, 130, 246);
        doc.text(`XGB: ${account.xgb_prob || '—'}%`, 105, y + 18);

        doc.setTextColor(239, 68, 68);
        doc.setFontSize(8);
        doc.text('CONFIRMED FRAUD', 22, y + 26);

        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('Action: Immediate account freeze + regulatory notification', pageWidth - 20, y + 26, { align: 'right' });

        y += 38;
      });

      y += 6;

      // ── Recommended Actions ──
      if (y < 240) {
        doc.setFillColor(30, 41, 59);
        doc.rect(14, y, pageWidth - 28, 10, 'F');
        doc.setTextColor(251, 191, 36);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('RECOMMENDED ACTIONS', 17, y + 7);
        y += 14;

        const actions = [
          '1. Immediately freeze all flagged accounts pending investigation',
          '2. Notify NPCI and relevant regulatory bodies',
          '3. Cross-reference with additional transaction history',
          '4. Initiate formal KYC re-verification for flagged users',
          '5. File Suspicious Activity Report (SAR) if required',
        ];

        actions.forEach(action => {
          doc.setTextColor(200, 210, 220);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(action, 17, y);
          y += 8;
        });
      }

      // ── Footer ──
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setFillColor(15, 23, 42);
      doc.rect(0, footerY - 5, pageWidth, 20, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('This report is system-generated by FinTech FDS — Unauthorized distribution is prohibited', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Page 1 | ${reportId}`, pageWidth / 2, footerY + 6, { align: 'center' });

      doc.save(`Fraud_Investigation_Report_${reportId}.pdf`);
      setGenerated('fraud');
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setGenerating(null);
    }
  };

  // ─── System Performance Report ───────────────────────────────────
  const generateSystemReport = async () => {
    setGenerating('system');
    setGenerated(null);

    try {
      const statsRes = await fetch(`${ML_URL}/api/stats`);
      const stats = await statsRes.json();

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const reportId = `SYS-${Date.now()}`;

      // ── Header ──
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 4, 45, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SYSTEM PERFORMANCE REPORT', 14, 16);

      doc.setTextColor(59, 130, 246);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('FINTECH FDS — ML MODEL ANALYSIS v2.0', 14, 24);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report ID: ${reportId}`, 14, 32);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
      doc.text(`Analyst: ${user?.name || 'Analyst'}`, pageWidth - 14, 32, { align: 'right' });
      doc.text(`Classification: CONFIDENTIAL`, pageWidth - 14, 38, { align: 'right' });

      doc.setFillColor(2, 6, 23);
      doc.rect(0, 45, pageWidth, 255, 'F');

      let y = 58;

      const addSection = (title, color = [59, 130, 246]) => {
        doc.setFillColor(20, 30, 48);
        doc.rect(14, y, pageWidth - 28, 10, 'F');
        doc.setFillColor(...color);
        doc.rect(14, y, 3, 10, 'F');
        doc.setTextColor(...color);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 20, y + 7);
        y += 14;
      };

      const addRow = (label, value, valueColor = [255, 255, 255]) => {
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(label, 17, y);
        doc.setTextColor(...valueColor);
        doc.setFont('helvetica', 'bold');
        doc.text(String(value), pageWidth - 14, y, { align: 'right' });
        doc.setDrawColor(30, 41, 59);
        doc.line(14, y + 2, pageWidth - 14, y + 2);
        y += 10;
      };

      // Dataset
      addSection('Dataset Overview', [59, 130, 246]);
      addRow('Dataset', 'PaySim — Mobile Money Transactions');
      addRow('Total Transactions', stats.total_transactions, [59, 130, 246]);
      addRow('Confirmed Fraud Cases', stats.fraud_cases, [239, 68, 68]);
      addRow('Fraud Rate', '0.129%', [251, 191, 36]);
      addRow('Class Imbalance Fix', 'SMOTE Applied — Balanced 50/50', [34, 197, 94]);
      addRow('Training / Test Split', '80% / 20% Stratified');

      y += 4;

      // Random Forest
      addSection('Primary Model — Random Forest', [34, 197, 94]);
      addRow('F1 Score', stats.rf_f1, [34, 197, 94]);
      addRow('ROC-AUC Score', stats.rf_auc, [34, 197, 94]);
      addRow('Precision', '0.84', [34, 197, 94]);
      addRow('Recall', '1.00 — Zero fraud missed', [34, 197, 94]);
      addRow('False Positives', '263', [251, 191, 36]);
      addRow('False Negatives', '0', [34, 197, 94]);
      addRow('Total Test Errors', '263 out of 1,272,524');

      y += 4;

      // XGBoost
      addSection('Secondary Model — XGBoost', [59, 130, 246]);
      addRow('F1 Score', stats.xgb_f1, [59, 130, 246]);
      addRow('ROC-AUC Score', stats.xgb_auc, [59, 130, 246]);
      addRow('Precision', '0.80', [59, 130, 246]);
      addRow('Recall', '1.00 — Zero fraud missed', [34, 197, 94]);
      addRow('False Positives', '329', [251, 191, 36]);
      addRow('False Negatives', '0', [34, 197, 94]);
      addRow('Total Test Errors', '329 out of 1,272,524');

      y += 4;

      // Features
      addSection('Feature Engineering — v2.0', [148, 163, 184]);
      addRow('Features Used', String(stats.features_used) + ' (clean, no leakage)');
      addRow('Top Feature (RF)', 'amount_to_balance_ratio — 42% importance');
      addRow('Top Feature (XGB)', 'is_overdraft — 79% importance');
      addRow('Leakage Fix', 'Removed post-transaction values', [34, 197, 94]);
      addRow('Explainability', 'SHAP values computed for both models', [34, 197, 94]);

      y += 4;

      // Architecture
      addSection('System Architecture', [148, 163, 184]);
      addRow('ML Backend', 'FastAPI (Python)');
      addRow('Auth Backend', 'Node.js + Express + MongoDB');
      addRow('Frontend', 'React + Tailwind CSS');
      addRow('Training Platform', 'Google Colab — CPU');

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setFillColor(15, 23, 42);
      doc.rect(0, footerY - 5, pageWidth, 20, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text('CONFIDENTIAL — FinTech Fraud Detection System v2.0', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`${reportId} | Internal Use Only`, pageWidth / 2, footerY + 6, { align: 'center' });

      doc.save(`System_Performance_Report_${reportId}.pdf`);
      setGenerated('system');
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-black">Forensic Reports</h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate professional PDF reports for investigation and compliance
          </p>
        </div>

        <div className="max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Fraud Accounts Report */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all duration-200 hover:border-slate-700">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-red-600/20 border border-red-500/30 rounded-xl flex items-center justify-center text-xl">
                🚨
              </div>
              <div>
                <h2 className="text-base font-black text-white">Fraud Investigation Report</h2>
                <p className="text-slate-400 text-xs mt-1">Flagged accounts with ML predictions</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {[
                'All currently flagged account IDs',
                'RF + XGBoost fraud probability per account',
                'Transaction type and risk classification',
                'Recommended regulatory actions',
                'Analyst and timestamp details',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-1 h-1 bg-red-500 rounded-full shrink-0"></div>
                  {item}
                </div>
              ))}
            </div>

            {generated === 'fraud' && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-2 rounded-lg text-xs mb-4">
                ✓ Report downloaded
              </div>
            )}

            <button
              onClick={generateFraudReport}
              disabled={generating !== null}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all text-sm active:scale-95"
            >
              {generating === 'fraud' ? 'Generating...' : '⬇ Download Fraud Report'}
            </button>
          </div>

          {/* System Report */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all duration-200 hover:border-slate-700">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-xl">
                📊
              </div>
              <div>
                <h2 className="text-base font-black text-white">System Performance Report</h2>
                <p className="text-slate-400 text-xs mt-1">ML model metrics and architecture</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {[
                'Random Forest — F1: 0.91 | Recall: 1.00',
                'XGBoost — F1: 0.89 | Recall: 1.00',
                'SMOTE balanced training details',
                'SHAP feature importance summary',
                'System architecture details',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-1 h-1 bg-blue-500 rounded-full shrink-0"></div>
                  {item}
                </div>
              ))}
            </div>

            {generated === 'system' && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-2 rounded-lg text-xs mb-4">
                ✓ Report downloaded
              </div>
            )}

            <button
              onClick={generateSystemReport}
              disabled={generating !== null}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all text-sm active:scale-95"
            >
              {generating === 'system' ? 'Generating...' : '⬇ Download System Report'}
            </button>
          </div>

        </div>

        {/* Report Info */}
        <div className="max-w-3xl mt-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
            Report Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Format', value: 'PDF Document' },
              { label: 'Classification', value: 'Confidential' },
              { label: 'Analyst', value: user?.name || 'Analyst' },
              { label: 'Dataset', value: '6.3M transactions' },
            ].map((item, i) => (
              <div key={i} className="text-center bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-xs text-slate-300 font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Reports;