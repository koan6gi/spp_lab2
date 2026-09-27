const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/db');

describe('Active Sessions API', () => {
  let userToken;
  let sessionId;

  beforeAll(async () => {
    await db.initDb();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' });

    userToken = loginRes.body.accessToken;
    sessionId = loginRes.body.sessionId;
  });

  afterAll(async () => {
    await db.pool.end();
  });

  it('should list active sessions for the current user including created_at (200)', async () => {
    const res = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const session = res.body[0];
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('user_agent');
    expect(session).toHaveProperty('ip_address');
    expect(session).toHaveProperty('last_active_at');
    expect(session).toHaveProperty('created_at');
    expect(session).toHaveProperty('isCurrent');
  });

  it('should revoke a session by ID (200)', async () => {
    const secondLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' });

    const secondSessionId = secondLogin.body.sessionId;

    const res = await request(app)
      .delete(`/api/auth/sessions/${secondSessionId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Session revoked successfully.');
  });
});
