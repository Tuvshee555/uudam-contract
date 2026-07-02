import { Pool } from "pg";
import { randomUUID } from "crypto";
import { defaultSettings, type ContractData, type ContractRecord, type ContractSettings } from "@/lib/types";

let pool: Pool | null = null;
let initialized = false;
let initializing: Promise<void> | null = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is missing");
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 3
    });
  }
  return pool;
}

async function ensureSchema() {
  if (initialized) return;
  if (initializing) return initializing;
  const db = getPool();
  initializing = (async () => {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS contracts (
          id UUID PRIMARY KEY,
          title TEXT NOT NULL,
          contract_number TEXT NOT NULL DEFAULT '',
          tourist_name TEXT NOT NULL DEFAULT '',
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
      initialized = true;
    } finally {
      initializing = null;
    }
  })();
  return initializing;
}

function toRecord(row: {
  id: string;
  title: string;
  contract_number: string;
  tourist_name: string;
  data: ContractData;
  created_at: Date;
  updated_at: Date;
}): ContractRecord {
  return {
    id: row.id,
    title: row.title,
    contractNumber: row.contract_number,
    touristName: row.tourist_name,
    data: row.data,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function listContracts(search = "") {
  await ensureSchema();
  const term = `%${search.trim()}%`;
  const result = search.trim()
    ? await getPool().query(
        `
          SELECT * FROM contracts
          WHERE title ILIKE $1
             OR contract_number ILIKE $1
             OR tourist_name ILIKE $1
             OR data::text ILIKE $1
          ORDER BY updated_at DESC
          LIMIT 80
        `,
        [term]
      )
    : await getPool().query("SELECT * FROM contracts ORDER BY updated_at DESC LIMIT 80");
  return result.rows.map(toRecord);
}

export async function getContract(id: string) {
  await ensureSchema();
  const result = await getPool().query("SELECT * FROM contracts WHERE id = $1", [id]);
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

export async function saveContract(input: {
  id?: string;
  title: string;
  contractNumber: string;
  touristName: string;
  data: ContractData;
}) {
  await ensureSchema();
  if (input.id) {
    const result = await getPool().query(
      `
        UPDATE contracts
        SET title = $2,
            contract_number = $3,
            tourist_name = $4,
            data = $5,
            updated_at = now()
        WHERE id = $1
        RETURNING *
      `,
      [input.id, input.title, input.contractNumber, input.touristName, input.data]
    );
    return result.rows[0] ? toRecord(result.rows[0]) : null;
  }

  const result = await getPool().query(
    `
      INSERT INTO contracts (id, title, contract_number, tourist_name, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [randomUUID(), input.title, input.contractNumber, input.touristName, input.data]
  );
  return toRecord(result.rows[0]);
}

export async function deleteContract(id: string) {
  await ensureSchema();
  await getPool().query("DELETE FROM contracts WHERE id = $1", [id]);
}

export async function getSettings(): Promise<ContractSettings> {
  await ensureSchema();
  const result = await getPool().query("SELECT value FROM app_settings WHERE key = 'contract_defaults'");
  return { ...defaultSettings, ...(result.rows[0]?.value ?? {}) };
}

export async function saveSettings(settings: ContractSettings) {
  await ensureSchema();
  await getPool().query(
    `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ('contract_defaults', $1, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `,
    [settings]
  );
  return settings;
}
