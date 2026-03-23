const mysql = require('mysql2/promise');

async function test() {
  try {
    const url = process.env.DATABASE_URL;
    console.log('DB URL exists:', !!url);
    if (!url) { console.log('No DATABASE_URL'); return; }
    const conn = await mysql.createConnection({ uri: url, connectTimeout: 5000 });
    const [rows] = await conn.execute('SELECT 1 as test');
    console.log('DB OK:', JSON.stringify(rows));
    await conn.end();
  } catch(e) {
    console.error('DB ERROR:', e.message);
  }
}
test();
