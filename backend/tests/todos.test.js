const request = require('supertest');
const { createApp } = require('../src/app');
const { pool, ensureSchema, waitForDatabase } = require('../src/db');

let app;

beforeAll(async () => {
  await waitForDatabase();
  await ensureSchema();
  app = createApp();
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE todos RESTART IDENTITY');
});

afterAll(async () => {
  await pool.end();
});

describe('Todo API', () => {
  test('GET /api/health returns ok when DB is reachable', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/todos returns empty list initially', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/todos creates a todo', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Write CI pipeline' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Write CI pipeline',
      completed: false,
    });
    expect(typeof res.body.id).toBe('number');
  });

  test('POST /api/todos rejects empty title', async () => {
    const res = await request(app).post('/api/todos').send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  test('PUT /api/todos/:id updates completion', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Deploy to staging' });

    const res = await request(app)
      .put(`/api/todos/${created.body.id}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  test('DELETE /api/todos/:id removes a todo', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Remove me' });

    const del = await request(app).delete(`/api/todos/${created.body.id}`);
    expect(del.status).toBe(204);

    const list = await request(app).get('/api/todos');
    expect(list.body).toHaveLength(0);
  });
});
