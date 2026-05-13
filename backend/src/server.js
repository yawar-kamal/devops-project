require('dotenv').config();
const { createApp } = require('./app');
const { ensureSchema, waitForDatabase, pool } = require('./db');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function main() {
  await waitForDatabase();
  await ensureSchema();

  const app = createApp();
  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Todo backend listening on port ${PORT}`);
  });

  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', err);
  process.exit(1);
});
