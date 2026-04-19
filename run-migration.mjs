import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
await conn.execute('ALTER TABLE `diets` ADD `includeAlternatives` int DEFAULT 0 NOT NULL;');
console.log('Migration applied successfully');
await conn.end();
