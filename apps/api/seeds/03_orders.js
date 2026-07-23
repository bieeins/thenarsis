export async function seed(knex) {
  await knex('orders').insert([
    {
      id: 'yx3qmnw1pgq114k',
      customer_name: 'John Smith',
      phone_number: '+1-555-0101',
      event_name: 'Wedding Ceremony',
      event_date: '2024-06-15',
      event_location: 'Grand Ballroom, Downtown',
      product_id: 'gx5e77dhkgseoti',
      status: 'Confirmed',
      description: 'Wedding photography and videography package',
    },
    {
      id: 'o4dtencpyhotj6y',
      customer_name: 'Sarah Johnson',
      phone_number: '+1-555-0102',
      event_name: 'Corporate Event',
      event_date: '2026-07-26',
      event_location: 'Convention Center',
      product_id: 'cse86albqefeoso',
      status: 'Pending',
    },
    {
      id: '2aq2ywihm4btacb',
      customer_name: 'Michael Chen',
      phone_number: '+1-555-0103',
      event_name: 'Birthday Party',
      event_date: '2026-08-10',
      event_location: 'Community Hall',
      product_id: 'ov5zy0wgrfdk8tt',
      status: 'In Progress',
    },
  ]);
}
