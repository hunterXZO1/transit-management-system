import React, { useState } from 'react';
import { Plus, X, Phone } from 'lucide-react';

interface MultiInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const MultiInput: React.FC<MultiInputProps> = ({
  label,
  values,
  onChange,
  placeholder = 'Add phone number...',
  helperText = 'Press Enter or click + to add multiple numbers',
  icon = <Phone className="w-4 h-4 text-slate-400" />,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Check duplicate
    if (values.includes(trimmed)) {
      setError('This number has already been added');
      return;
    }

    onChange([...values, trimmed]);
    setInputValue('');
    setError(null);
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(values.filter((_, i) => i !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
      </label>

      {/* Existing items pill row */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
          {values.map((val, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white text-slate-800 rounded-md border border-slate-200 shadow-sm"
            >
              {icon}
              <span>{val}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-slate-400 hover:text-rose-600 transition-colors"
                title="Remove number"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : (
        helperText && <p className="text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
};
