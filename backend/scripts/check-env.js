require('dotenv').config();
console.log('DB URL:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING');
console.log('Direct URL:', process.env.DIRECT_URL ? 'FOUND' : 'MISSING');
