
import React from 'react';
import './ParameterInput.css';

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
    <div className="field">
      <div className="field-header">
        <label htmlFor={id}>
          <span className="field-label-text">{label}</span>
          {unit && <span className="unit">{unit}</span>}
        </label>

        {tooltip && (
          <span className="tooltip-icon" tabIndex={0} aria-label={tooltip}>
            ?
            <span className="tooltip-text">{tooltip}</span>
          </span>
        )}
      </div>

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
    </div>
  );
}
