const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/db');

describe('Role-Based Access Control (RBAC) API', () => {
  let adminToken;
  let modToken;
  let userToken;

  beforeAll(async () => {
    await db.initDb();

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    adminToken = adminLogin.body.accessToken;

    const modLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'moderator@example.com', password: 'Password123!' });
    modToken = modLogin.body.accessToken;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' });
    userToken = userLogin.body.accessToken;
  });

  it('should deny unauthenticated requests to /api/users (401)', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_TOKEN_REQUIRED');
  });

  it('should deny regular user access to /api/users (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ROLE');
  });

  it('should deny moderator access to /api/users (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${modToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ROLE');
  });

  it('should allow admin access to /api/users (200)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });
});
