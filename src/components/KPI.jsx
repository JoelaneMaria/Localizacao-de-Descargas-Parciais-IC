import React from 'react';
import './KPI.css';

/**
 * KPI card component for displaying calculated results.
 */
export default function KPI({ label, value, sub, tooltip }) {
  return (
    <div className="kpi" title={tooltip || ''}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
