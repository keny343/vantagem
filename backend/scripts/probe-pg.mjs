import pg from 'pg';

const tries = [
  'postgresql://karga:karga_dev@localhost:5432/karga',
  'postgresql://karga:karga_dev@localhost:5432/postgres',
  'postgresql://karga:karga_dev@localhost:5433/karga',
];

for (const url of tries) {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 4000 });
  try {
    await client.connect();
    console.log('OK', url);
    const dbs = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log(dbs.rows);
    await client.end();
  } catch (e) {
    console.log('FAIL', url, e instanceof Error ? e.message : e);
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}
