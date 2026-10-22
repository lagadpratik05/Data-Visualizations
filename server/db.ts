import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, InsertDataset, datasets, InsertColumn, columns, InsertQuery, queries, InsertKPI, kpis, InsertReport, reports } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Dataset queries
export async function getUserDatasets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(datasets).where(eq(datasets.userId, userId));
}

export async function getDatasetById(datasetId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(datasets)
    .where(and(eq(datasets.id, datasetId), eq(datasets.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDataset(data: InsertDataset) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(datasets).values(data);
  return result;
}

export async function updateDataset(datasetId: number, data: Partial<InsertDataset>) {
  const db = await getDb();
  if (!db) return undefined;
  return db.update(datasets).set(data).where(eq(datasets.id, datasetId));
}

export async function deleteDataset(datasetId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return db.delete(datasets).where(eq(datasets.id, datasetId));
}

// Column queries
export async function getDatasetColumns(datasetId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(columns).where(eq(columns.datasetId, datasetId));
}

export async function createColumn(data: InsertColumn) {
  const db = await getDb();
  if (!db) return undefined;
  return db.insert(columns).values(data);
}

export async function createColumns(data: InsertColumn[]) {
  const db = await getDb();
  if (!db) return undefined;
  return db.insert(columns).values(data);
}

// Query queries
export async function getUserQueries(userId: number, datasetId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (datasetId) {
    return db.select().from(queries).where(and(eq(queries.userId, userId), eq(queries.datasetId, datasetId)));
  }
  return db.select().from(queries).where(eq(queries.userId, userId));
}

export async function createQuery(data: InsertQuery) {
  const db = await getDb();
  if (!db) return undefined;
  return db.insert(queries).values(data);
}

// KPI queries
export async function getDatasetKPIs(datasetId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kpis).where(and(eq(kpis.datasetId, datasetId), eq(kpis.userId, userId)));
}

export async function createKPI(data: InsertKPI) {
  const db = await getDb();
  if (!db) return undefined;
  return db.insert(kpis).values(data);
}

export async function updateKPI(kpiId: number, data: Partial<InsertKPI>) {
  const db = await getDb();
  if (!db) return undefined;
  return db.update(kpis).set(data).where(eq(kpis.id, kpiId));
}

export async function deleteKPI(kpiId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return db.delete(kpis).where(eq(kpis.id, kpiId));
}

// Report queries
export async function getUserReports(userId: number, datasetId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (datasetId) {
    return db.select().from(reports).where(and(eq(reports.userId, userId), eq(reports.datasetId, datasetId)));
  }
  return db.select().from(reports).where(eq(reports.userId, userId));
}

export async function getReportById(reportId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) return undefined;
  return db.insert(reports).values(data);
}

export async function updateReport(reportId: number, data: Partial<InsertReport>) {
  const db = await getDb();
  if (!db) return undefined;
  return db.update(reports).set(data).where(eq(reports.id, reportId));
}

export async function deleteReport(reportId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return db.delete(reports).where(eq(reports.id, reportId));
}
