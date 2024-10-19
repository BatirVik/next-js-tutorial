import bcrypt from "bcrypt";
import { invoices, customers, revenue, users } from "../lib/placeholder-data";
import { PoolClient, Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  query_timeout: 5000,
});

async function seedUsers(client: PoolClient) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);
  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const text = `
        INSERT INTO users (id, name, email, password)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING;
      `;
      return client.query(text, Object.values(user));
    }),
  );
  return insertedUsers;
}

async function seedInvoices(client: PoolClient) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `);

  const insertedInvoices = await Promise.all(
    invoices.map((invoice) => {
      const text = `
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING;
      `;
      const values = Object.values(invoice);
      return client.query(text, values);
    }),
  );

  return insertedInvoices;
}

async function seedCustomers(client: PoolClient) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `);
  const insertedCustomers = await Promise.all(
    customers.map((customer) => {
      const text = `
        INSERT INTO customers (id, name, email, image_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING;
      `;
      const values = Object.values(customer);
      return client.query(text, values);
    }),
  );

  return insertedCustomers;
}

async function seedRevenue(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `);

  const insertedRevenue = await Promise.all(
    revenue.map((rev) => {
      const text = `
        INSERT INTO revenue (month, revenue)
        VALUES ($1, $2)
        ON CONFLICT (month) DO NOTHING;
      `;
      const values = Object.values(rev);
      return client.query(text, values);
    }),
  );

  return insertedRevenue;
}

export async function GET() {
  const client = await pool.connect();
  try {
    await client.query(`BEGIN`);
    await seedUsers(client);
    await seedCustomers(client);
    await seedInvoices(client);
    await seedRevenue(client);
    await client.query(`COMMIT`);
    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error(error);
    await client.query(`ROLLBACK`);
    return Response.json({ error }, { status: 500 });
  } finally {
    client.release();
  }
}
