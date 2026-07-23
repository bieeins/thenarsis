import bcrypt from 'bcrypt';

const ROUNDS = 12;

export async function seed(knex) {
  const users = [
    { id: '5w5atoldkwg9n4j', email: 'owner@example.com', password: 'SecurePass123!', name: 'Business Owner', role: 'owner', phone: '+1234567890' },
    { id: 't1ru9d7pqhqdx86', email: 'designer@example.com', password: 'DesignPass123!', name: 'Professional Designer', role: 'designer', phone: '+1234567891' },
    { id: 'zprtbfbw0ff6fyx', email: 'crew@example.com', password: 'CrewPass123!', name: 'Crew Member', role: 'crew', phone: '+1234567892' },
    { id: 'ifxbmw81w91l2bv', email: 'reviewer@example.com', password: 'reviewer123', name: 'Design Reviewer', role: 'design_reviewer', phone: null },
  ];

  for (const user of users) {
    await knex('users').insert({
      id: user.id,
      email: user.email,
      password_hash: await bcrypt.hash(user.password, ROUNDS),
      name: user.name,
      role: user.role,
      phone: user.phone,
      verified: true,
    });
  }
}
