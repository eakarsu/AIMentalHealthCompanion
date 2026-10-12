// Accept direct arrays and the paginated envelopes returned by record APIs.
export function recordList(payload) {
  let value = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== 'object') return [];
    value = value.data ?? value.items ?? value.records ?? value.results;
  }
  return Array.isArray(value) ? value : [];
}
