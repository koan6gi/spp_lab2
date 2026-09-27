const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/db');

describe('Authentication & Security API', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let refreshToken;

  beforeAll(async () => {
    await db.initDb();
  });

  afterAll(async () => {
    await db.pool.query('DELETE FROM users WHERE email LIKE $1', ['test_%']);
    await db.pool.end();
  });

  it('should register a new user successfully (201)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.role).toBe('user');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    refreshToken = res.body.refreshToken;
  });

  it('should reject registration with invalid email (422)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid-email', password: testPassword });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_EMAIL_FORMAT');
  });

  it('should reject registration with short password (422)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `valid_${Date.now()}@example.com`, password: '123' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('PASSWORD_TOO_SHORT');
  });

  it('should reject registration with duplicate email (409)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('should log in successfully with valid credentials (200)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should reject login with wrong password (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('should refresh access token using valid refresh token (200)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should handle forgot-password gracefully (200)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testEmail });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});
