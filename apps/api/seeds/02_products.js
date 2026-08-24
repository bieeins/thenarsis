export async function seed(knex) {
  await knex('products').insert([
    { id: 'ov5zy0wgrfdk8tt', package_name: 'Basic Photography Package', description: 'Standard photography package for events', base_price: 500000, category: 'Photography' },
    { id: 'cse86albqefeoso', package_name: 'Premium Videography Package', description: 'Professional videography with editing', base_price: 1200000, category: 'Videography' },
    { id: 'gx5e77dhkgseoti', package_name: 'Complete Bundle', description: 'Photography and videography combined', base_price: 1800000, category: 'Bundle' },
  ]);
}
