import pg from 'pg';

const admin = new pg.Client({
  connectionString: 'postgresql://karga:karga_dev@localhost:5432/postgres',
});
await admin.connect();
const exists = await admin.query(`SELECT 1 FROM pg_database WHERE datname = 'vantagem'`);
if (exists.rowCount === 0) {
  await admin.query(`CREATE DATABASE vantagem`);
  console.log('created database vantagem');
} else {
  console.log('database vantagem already exists');
}
await admin.end();
