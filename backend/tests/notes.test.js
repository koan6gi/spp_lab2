const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/db');

describe('Notes CRUD & RBAC Ownership API', () => {
  let userToken;
  let modToken;
  let noteId;

  beforeAll(async () => {
    await db.initDb();

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' });
    userToken = userLogin.body.accessToken;

    const modLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'moderator@example.com', password: 'Password123!' });
    modToken = modLogin.body.accessToken;
  });

  it('should create a note for user (201)', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'My Private Note', text: 'Secret text' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('My Private Note');
    noteId = res.body.id;
  });

  it('should fetch notes for user (200)', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((n) => n.id === noteId)).toBe(true);
  });

  it('should allow moderator to view notes across all users (200)', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${modToken}`);

    expect(res.status).toBe(200);
    expect(res.body.some((n) => n.id === noteId)).toBe(true);
  });

  it('should allow moderator to update user note (200)', async () => {
    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${modToken}`)
      .send({ title: 'Moderated Note Title', text: 'Content approved' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Moderated Note Title');
  });

  it('should allow user to delete their own note (204)', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(204);
  });
});
