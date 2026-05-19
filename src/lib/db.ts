import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

function requireTursoEnv(): { url: string; authToken: string } {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error(
      "Server configuration error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in your .env file."
    );
  }
  return { url, authToken };
}

export function getDb(): Client {
  if (!client) {
    const { url, authToken } = requireTursoEnv();
    client = createClient({ url, authToken });
  }
  return client;
}

export function isValidId(id: string): boolean {
  return /^\d+$/.test(id);
}

async function initSchema(): Promise<void> {
  const db = getDb();
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        security_phrase_hash TEXT NOT NULL,
        pan_number_hash TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        profile_icon TEXT,
        recovery_otp_hash TEXT,
        recovery_otp_expiry TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS software (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        seller_username TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        version TEXT,
        category TEXT,
        license_type TEXT,
        license_terms TEXT,
        file_url TEXT NOT NULL,
        logo_url TEXT,
        licensing_rules TEXT NOT NULL,
        decryption_key TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        software_id INTEGER NOT NULL REFERENCES software(id) ON DELETE CASCADE,
        software_title TEXT NOT NULL,
        buyer_address TEXT NOT NULL,
        token_id INTEGER NOT NULL,
        transaction_hash TEXT NOT NULL,
        mint_date TEXT NOT NULL DEFAULT (datetime('now')),
        buyer_ip TEXT DEFAULT '',
        device_id TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        reason TEXT,
        last_violation_date TEXT
      )`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_software_seller_username ON software(seller_username)`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_licenses_buyer_address ON licenses(buyer_address)`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_licenses_software_id ON licenses(software_id)`,
      args: [],
    },
  ]);
}

export async function ensureSchema(): Promise<Client> {
  if (!schemaReady) {
    schemaReady = initSchema();
  }
  await schemaReady;
  await migrateSchema(getDb());
  return getDb();
}

/** Add columns for databases created before newer app versions. */
async function migrateSchema(db: Client): Promise<void> {
  try {
    await db.execute({
      sql: "ALTER TABLE software ADD COLUMN original_file_name TEXT",
      args: [],
    });
  } catch {
    // column already exists
  }
}

export type LicensingRules = {
  ipLock: boolean;
  fingerprintLock: boolean;
};

export function parseLicensingRules(json: string | null | undefined): LicensingRules {
  if (!json) {
    return { ipLock: false, fingerprintLock: false };
  }
  try {
    const parsed = JSON.parse(json) as Partial<LicensingRules>;
    return {
      ipLock: Boolean(parsed.ipLock),
      fingerprintLock: Boolean(parsed.fingerprintLock),
    };
  } catch {
    return { ipLock: false, fingerprintLock: false };
  }
}

type UserRow = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  security_phrase_hash: string;
  pan_number_hash: string;
  wallet_address: string;
  profile_icon: string | null;
  recovery_otp_hash: string | null;
  recovery_otp_expiry: string | null;
  created_at: string;
};

type SoftwareRow = {
  id: number;
  seller_id: number;
  seller_username: string;
  title: string;
  description: string | null;
  price: number;
  version: string | null;
  category: string | null;
  license_type: string | null;
  license_terms: string | null;
  file_url: string;
  original_file_name: string | null;
  logo_url: string | null;
  licensing_rules: string;
  decryption_key: string;
  created_at: string;
  seller_profile_icon?: string | null;
  seller_wallet_address?: string | null;
};

type LicenseRow = {
  id: number;
  software_id: number;
  software_title: string;
  buyer_address: string;
  token_id: number;
  transaction_hash: string;
  mint_date: string;
  buyer_ip: string | null;
  device_id: string | null;
  status: string;
  reason: string | null;
  last_violation_date: string | null;
};

export function mapSoftwareRow(row: SoftwareRow) {
  return {
    _id: String(row.id),
    sellerId: String(row.seller_id),
    sellerUsername: row.seller_username,
    title: row.title,
    description: row.description ?? "",
    price: row.price,
    version: row.version ?? "",
    category: row.category ?? "",
    licenseType: row.license_type ?? "",
    licenseTerms: row.license_terms ?? "",
    fileUrl: row.file_url,
    originalFileName: row.original_file_name ?? undefined,
    logoUrl: row.logo_url,
    licensingRules: parseLicensingRules(row.licensing_rules),
    decryptionKey: row.decryption_key,
    createdAt: row.created_at,
    sellerProfileIcon: row.seller_profile_icon ?? undefined,
    sellerWalletAddress: row.seller_wallet_address ?? "",
  };
}

export function mapLicenseRow(row: LicenseRow) {
  return {
    _id: String(row.id),
    softwareId: String(row.software_id),
    softwareTitle: row.software_title,
    buyerAddress: row.buyer_address,
    tokenId: row.token_id,
    transactionHash: row.transaction_hash,
    mintDate: row.mint_date,
    buyerIp: row.buyer_ip ?? "",
    deviceId: row.device_id ?? "",
    status: row.status as "active" | "blocked" | "revoked",
    reason: row.reason ?? undefined,
    lastViolationDate: row.last_violation_date ?? undefined,
  };
}

export type { UserRow, SoftwareRow, LicenseRow };
