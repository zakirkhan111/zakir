const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 ImpactHub API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});
