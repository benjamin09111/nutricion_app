#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

if (!url.startsWith('postgresql://')) {
  console.error(`❌ Invalid DATABASE_URL: must start with "postgresql://", got "${url.substring(0, 20)}..."`);
  process.exit(1);
}

try {
  const parsed = new URL(url);
  console.log(`✅ Database URL valid`);
  console.log(`   Host: ${parsed.host}`);
  console.log(`   Protocol: ${parsed.protocol}`);
  console.log(`   Database: ${parsed.pathname}`);
} catch (e) {
  console.error(`❌ Invalid DATABASE_URL format: ${e.message}`);
  process.exit(1);
}

const prisma = new PrismaClient();
prisma.$connect()
  .then(() => {
    console.log('✅ Database connection successful');
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error(`❌ Database connection failed: ${err.message}`);
    process.exit(1);
  });