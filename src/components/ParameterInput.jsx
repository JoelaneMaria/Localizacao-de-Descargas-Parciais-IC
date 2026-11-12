import React from 'react';
import './ParameterInput.css';

/**
 * Reusable numeric parameter input with label, unit badge, and tooltip.
 */
export default function ParameterInput({
  id,
  label,
  unit,
  value,
  onChange,
  tooltip,
  step = 'any',
  min,
  max,
  required = true,
  disabled = false,
}) {
  return (
    <div className="field" title={tooltip || ''}>
      <label htmlFor={id}>
        <span className="field-label-text">{label}</span>
        {unit && <span className="unit">{unit}</span>}
      </label>
      <input
        type="number"
        id={id}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      />
      {tooltip && (
        <span className="tooltip-icon" tabIndex={0} aria-label={tooltip}>
          ?
          <span className="tooltip-text">{tooltip}</span>
        </span>
      )}
    </div>
  );
}
