let users = [
  {
    id: '1',
    email: 'admin@test.com',
    password: '$2b$10$OMDtxVP.895X/kjWrx4ODevOvD7G5QZFJxdE3rkqYkEyU39xsU8T2',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: '2',
    email: 'user@test.com',
    password: '$2b$10$3fOf.Y32D3dYWn05eyHez.a2paGw6ioqPj1u.so7Wlnjn7ufvQJDe',
    name: 'Regular User',
    role: 'user',
    createdAt: new Date('2024-01-02').toISOString()
  }
];

module.exports = { users };