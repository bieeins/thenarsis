export function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const perPage = Math.min(100, Math.max(1, Number.parseInt(query.perPage, 10) || 20));
  return { page, perPage, offset: (page - 1) * perPage };
}

export function parseSort(query, allowedFields, defaultField = 'created_at') {
  const field = allowedFields.includes(query.sort) ? query.sort : defaultField;
  const order = query.order === 'asc' ? 'asc' : 'desc';
  return { field, order };
}
