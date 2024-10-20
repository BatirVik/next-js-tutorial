import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  query_timeout: 5000,
});
