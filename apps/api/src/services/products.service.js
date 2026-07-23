import { productsRepository } from '../repositories/products.repository.js';
import { parsePagination, parseSort } from '../utils/pagination.js';
import { notFound } from '../utils/http-error.js';

const SORTABLE_FIELDS = ['created_at', 'base_price', 'package_name'];

export const productsService = {
  async list(query) {
    const { page, perPage, offset } = parsePagination(query);
    const { field, order } = parseSort(query, SORTABLE_FIELDS);
    const { rows, totalItems } = await productsRepository.list({
      search: query.search,
      category: query.category,
      page, perPage, offset, sortField: field, sortOrder: order,
    });
    return { rows, page, perPage, totalItems };
  },

  async get(id) {
    const product = await productsRepository.findById(id);
    if (!product) throw notFound('Product not found');
    return product;
  },

  async create(data) {
    return productsRepository.create(data);
  },

  async update(id, data) {
    await this.get(id);
    return productsRepository.update(id, data);
  },

  async remove(id) {
    await this.get(id);
    await productsRepository.delete(id);
  },
};
