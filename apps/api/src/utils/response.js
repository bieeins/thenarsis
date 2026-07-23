export function ok(res, data, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.json(body);
}

export function created(res, data) {
  return res.status(201).json({ success: true, data });
}

export function paginated(res, data, { page, perPage, totalItems }) {
  return res.json({
    success: true,
    data,
    meta: {
      page,
      perPage,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / perPage)),
    },
  });
}
