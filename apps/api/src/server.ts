import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/db.config.js';
import { seedUsers } from './utils/seed.js';

async function main(): Promise<void> {
  // Connect to database
  await connectDatabase();

  // Seed initial users (admin + normal user)
  await seedUsers();

  // Create and start server
  const app = createApp();
  
  app.listen(config.port, () => {
    console.log(`
🚀 OpenFeedback API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 Environment: ${config.nodeEnv}
🔗 URL: http://localhost:${config.port}
📡 API Base: http://localhost:${config.port}/api/v1
📚 Swagger: http://localhost:${config.port}/api-docs
❤️  Health: http://localhost:${config.port}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
