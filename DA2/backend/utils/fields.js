const PATTERNS = {
  id: /^[A-Za-z0-9][A-Za-z0-9_-]{0,29}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
  phone: /^\d{7,15}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
};

const labelOf = (field) => field.label || field.field;

export function normalizeForDb(field, value) {
  switch (field.type) {
    case 'text':
    case 'id':
    case 'email':
    case 'phone':
    case 'enum':
      return String(value).trim();
    case 'int':
      return Math.trunc(Number(value));
    case 'decimal':
      return Number(value);
    case 'time': {
      const [h, m, s = '00'] = String(value).split(':');
      return `${h}:${m}:${s}`;
    }
    default:
      return value;
  }
}

export function rowToClient(field, raw) {
  if (raw === null || raw === undefined) return field.nullable ? null : '';
  switch (field.type) {
    case 'time': {
      const parts = String(raw).split(':');
      return parts.slice(0, 2).join(':');
    }
    case 'date':
      return String(raw).slice(0, 10);
    case 'int':
    case 'decimal':
      return Number(raw);
    default:
      return String(raw);
  }
}

export function validateValue(field, value) {
  const label = labelOf(field);
  const empty = value === undefined || value === null || value === '';

  if (empty) {
    if (field.required) return `${label} is required.`;
    return null;
  }

  const text = String(value).trim();

  switch (field.type) {
    case 'id':
      if (!PATTERNS.id.test(text)) return `${label} may only contain letters, numbers, hyphens or underscores (max 30).`;
      return null;
    case 'email':
      if (!PATTERNS.email.test(text)) return `${label} must be a valid email address.`;
      return null;
    case 'phone':
      if (!PATTERNS.phone.test(text.replace(/[\s-]/g, ''))) return `${label} must be 7-15 digits.`;
      return null;
    case 'text':
      if (field.maxLength && text.length > field.maxLength) return `${label} must be ${field.maxLength} characters or fewer.`;
      return null;
    case 'enum':
      if (!field.values.includes(text)) return `${label} must be one of: ${field.values.join(', ')}.`;
      return null;
    case 'int': {
      const n = Number(value);
      if (!Number.isFinite(n)) return `${label} must be a number.`;
      if (field.min !== undefined && Math.trunc(n) < field.min) return `${label} must be at least ${field.min}.`;
      if (field.max !== undefined && Math.trunc(n) > field.max) return `${label} must be at most ${field.max}.`;
      return null;
    }
    case 'decimal': {
      const n = Number(value);
      if (!Number.isFinite(n)) return `${label} must be a number.`;
      if (field.min !== undefined && n < field.min) return `${label} must be at least ${field.min}.`;
      return null;
    }
    case 'date':
      if (!PATTERNS.date.test(text) || Number.isNaN(Date.parse(text))) return `${label} must be a YYYY-MM-DD date.`;
      return null;
    case 'time':
      if (!PATTERNS.time.test(text)) return `${label} must be a HH:MM (or HH:MM:SS) time.`;
      return null;
    default:
      return null;
  }
}

export function validateChildValues(field, values) {
  if (values === undefined || values === null) return [];
  if (!Array.isArray(values)) throw new Error(`${labelOf(field)} must be a list.`);
  const cleaned = [];
  const seen = new Set();
  for (const raw of values) {
    const value = String(raw ?? '').trim();
    if (!value) continue;
    const error = validateValue(field, value);
    if (error) throw new Error(error);
    if (!seen.has(value)) {
      seen.add(value);
      cleaned.push(value);
    }
  }
  return cleaned;
}
