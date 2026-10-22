import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Datasets table - stores uploaded CSV/Excel files
 */
export const datasets = mysqlTable("datasets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  rowCount: int("rowCount").default(0),
  columnCount: int("columnCount").default(0),
  fileSize: int("fileSize").default(0),
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = typeof datasets.$inferInsert;

/**
 * Columns table - stores metadata about dataset columns
 */
export const columns = mysqlTable("columns", {
  id: int("id").autoincrement().primaryKey(),
  datasetId: int("datasetId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  dataType: varchar("dataType", { length: 50 }).notNull(), // string, number, date, boolean
  nullCount: int("nullCount").default(0),
  uniqueCount: int("uniqueCount").default(0),
  minValue: text("minValue"),
  maxValue: text("maxValue"),
  avgValue: decimal("avgValue", { precision: 15, scale: 4 }),
  stdDev: decimal("stdDev", { precision: 15, scale: 4 }),
  sampleValues: json("sampleValues"), // JSON array of sample values
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Column = typeof columns.$inferSelect;
export type InsertColumn = typeof columns.$inferInsert;

/**
 * Queries table - stores user's NL queries and results
 */
export const queries = mysqlTable("queries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  datasetId: int("datasetId").notNull(),
  question: text("question").notNull(),
  sqlQuery: text("sqlQuery"),
  result: json("result"), // JSON array of result rows
  chartType: varchar("chartType", { length: 50 }), // bar, line, pie, scatter
  chartData: json("chartData"), // Formatted data for Recharts
  insights: text("insights"), // AI-generated insights
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Query = typeof queries.$inferSelect;
export type InsertQuery = typeof queries.$inferInsert;

/**
 * KPIs table - stores configured KPI cards
 */
export const kpis = mysqlTable("kpis", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  datasetId: int("datasetId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  columnId: int("columnId").notNull(),
  metricType: varchar("metricType", { length: 50 }).notNull(), // sum, avg, count, min, max
  value: decimal("value", { precision: 15, scale: 4 }),
  previousValue: decimal("previousValue", { precision: 15, scale: 4 }),
  trend: varchar("trend", { length: 10 }), // up, down, neutral
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KPI = typeof kpis.$inferSelect;
export type InsertKPI = typeof kpis.$inferInsert;

/**
 * Reports table - stores generated reports
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  datasetId: int("datasetId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  chartIds: json("chartIds"), // JSON array of query IDs to include
  kpiIds: json("kpiIds"), // JSON array of KPI IDs to include
  insights: text("insights"), // AI-generated summary insights
  pdfUrl: text("pdfUrl"), // URL to generated PDF
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;