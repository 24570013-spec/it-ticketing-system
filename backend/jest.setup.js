'use strict';

// Set required env vars before any module is loaded by Jest
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'testuser';
process.env.DB_PASSWORD = 'testpassword';
process.env.DB_NAME = 'testdb';
process.env.JWT_SECRET = 'testsecret';
process.env.PORT = '3001';
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGIN = 'http://localhost:5173';
