function truncate(value, maxLength = 1024) {
  const text = String(value ?? '').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function formatList(values, options = {}) {
  const empty = options.empty || 'None';
  const limit = options.limit || 10;
  const items = Array.isArray(values)
    ? values
    : values
      ? [values]
      : [];

  const cleaned = items
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      return item?.name || item?.username || item?.displayName || item?.title || '';
    })
    .map((item) => String(item).trim())
    .filter(Boolean);

  if (cleaned.length === 0) {
    return empty;
  }

  const visible = cleaned.slice(0, limit);
  const suffix = cleaned.length > limit ? `, +${cleaned.length - limit} more` : '';
  return `${visible.join(', ')}${suffix}`;
}

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
}

function formatNumber(value, fallback = 'Unknown') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US').format(value);
  }

  return String(value);
}

module.exports = {
  formatDate,
  formatList,
  formatNumber,
  truncate,
};
