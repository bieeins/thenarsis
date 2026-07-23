export function toQueryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, value);
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}

// Fetches every page from a paginated `list`-shaped endpoint and concatenates
// the results, mirroring PocketBase's getFullList() behavior.
export async function fetchAllPages(listFn, params = {}) {
  const perPage = 100;
  let page = 1;
  let all = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await listFn({ ...params, page, perPage });
    all = all.concat(res.data);
    if (!res.meta || page >= res.meta.totalPages) break;
    page += 1;
  }
  return all;
}
