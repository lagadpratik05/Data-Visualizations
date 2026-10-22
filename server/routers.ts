import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import * as XLSX from "xlsx";

function generateSampleResults(question: string, columns: any[]): Record<string, any>[] {
  const results: Record<string, any>[] = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const categories = ["Product A", "Product B", "Product C", "Product D"];

  if (question.toLowerCase().includes("month") || question.toLowerCase().includes("by month")) {
    for (let i = 0; i < 12; i++) {
      results.push({
        month: months[i],
        sales: Math.floor(Math.random() * 50000) + 10000,
        revenue: Math.floor(Math.random() * 100000) + 20000,
      });
    }
  } else if (question.toLowerCase().includes("category") || question.toLowerCase().includes("product")) {
    for (const cat of categories) {
      results.push({
        category: cat,
        sales: Math.floor(Math.random() * 100000) + 20000,
        percentage: Math.floor(Math.random() * 30) + 10,
      });
    }
  } else {
    for (let i = 0; i < 10; i++) {
      const row: Record<string, any> = {};
      for (const col of columns.slice(0, 3)) {
        if (col.dataType === "number") {
          row[col.name] = Math.floor(Math.random() * 10000);
        } else if (col.dataType === "date") {
          row[col.name] = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];
        } else {
          row[col.name] = `Value ${i + 1}`;
        }
      }
      results.push(row);
    }
  }
  return results;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Dataset procedures
  dataset: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserDatasets(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const dataset = await db.getDatasetById(input.id, ctx.user.id);
        if (!dataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }
        return dataset;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        fileName: z.string(),
        fileKey: z.string(),
        fileUrl: z.string(),
        rowCount: z.number().default(0),
        columnCount: z.number().default(0),
        fileSize: z.number().default(0),
        mimeType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createDataset({
          userId: ctx.user.id,
          ...input,
        });
        return result;
      }),

    rename: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const dataset = await db.getDatasetById(input.id, ctx.user.id);
        if (!dataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }
        await db.updateDataset(input.id, { name: input.name });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const dataset = await db.getDatasetById(input.id, ctx.user.id);
        if (!dataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }
        await db.deleteDataset(input.id);
        return { success: true };
      }),
  }),

  // File upload and parsing
  file: router({
    upload: protectedProcedure
      .input(z.object({
        file: z.instanceof(File),
        datasetName: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const buffer = await input.file.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);

          // Parse CSV or Excel
          let data: Record<string, unknown>[] = [];
          let columns: string[] = [];

          if (input.file.name.endsWith(".csv")) {
            // Parse CSV
            const text = new TextDecoder().decode(uint8Array);
            const lines = text.split("\n").filter(l => l.trim());
            if (lines.length > 0) {
              columns = lines[0].split(",").map(c => c.trim());
              for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(",");
                const row: Record<string, unknown> = {};
                columns.forEach((col, idx) => {
                  row[col] = values[idx]?.trim() || null;
                });
                data.push(row);
              }
            }
          } else if (input.file.name.endsWith(".xlsx") || input.file.name.endsWith(".xls")) {
            // Parse Excel
            const workbook = XLSX.read(uint8Array, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            data = XLSX.utils.sheet_to_json(sheet);
            if (data.length > 0) {
              columns = Object.keys(data[0]);
            }
          } else {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported file format" });
          }

          // Upload file to S3
          const fileKey = `${ctx.user.id}-datasets/${Date.now()}-${input.file.name}`;
          const { url } = await storagePut(fileKey, uint8Array, input.file.type);

          // Create dataset record
          const dataset = await db.createDataset({
            userId: ctx.user.id,
            name: input.datasetName,
            fileName: input.file.name,
            fileKey,
            fileUrl: url,
            rowCount: data.length,
            columnCount: columns.length,
            fileSize: uint8Array.length,
            mimeType: input.file.type,
          });

          // Get the inserted dataset ID
          const datasetId = (dataset as any).insertId || (dataset as any)[0]?.id;

          // Profile columns and create column records
          const columnRecords = columns.map(col => {
            const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined);
            const numericValues = values.map(v => parseFloat(String(v))).filter(v => !isNaN(v));

            let dataType = "string";
            if (numericValues.length > values.length * 0.8) {
              dataType = "number";
            } else if (values.some(v => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) {
              dataType = "date";
            }

            const avgVal = numericValues.length > 0 ? Math.round(numericValues.reduce((a, b) => a + b, 0) / numericValues.length * 10000) / 10000 : null;
            return {
              datasetId,
              name: col,
              dataType,
              nullCount: data.length - values.length,
              uniqueCount: new Set(values).size,
              minValue: numericValues.length > 0 ? String(Math.min(...numericValues)) : null,
              maxValue: numericValues.length > 0 ? String(Math.max(...numericValues)) : null,
              avgValue: avgVal as any,
              sampleValues: values.slice(0, 5),
            };
          });

          await db.createColumns(columnRecords);

          return {
            success: true,
            datasetId,
            rowCount: data.length,
            columnCount: columns.length,
          };
        } catch (error) {
          console.error("File upload error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to upload and parse file",
          });
        }
      }),
  }),

  // Column procedures
  column: router({
    list: protectedProcedure
      .input(z.object({ datasetId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dataset = await db.getDatasetById(input.datasetId, ctx.user.id);
        if (!dataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }
        return db.getDatasetColumns(input.datasetId);
      }),
  }),

  // Query procedures for NL queries
  query: router({
    list: protectedProcedure
      .input(z.object({ datasetId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dataset = await db.getDatasetById(input.datasetId, ctx.user.id);
        if (!dataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }
        return db.getUserQueries(ctx.user.id, input.datasetId);
      }),

    ask: protectedProcedure
      .input(z.object({
        datasetId: z.number(),
        question: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const dataset = await db.getDatasetById(input.datasetId, ctx.user.id);
        if (!dataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }

        const columns = await db.getDatasetColumns(input.datasetId);
        const columnInfo = columns.map(c => `${c.name} (${c.dataType})`).join(", ");

        // Use LLM to generate SQL
        const sqlResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a SQL expert. Generate a SQL query based on the user's question. The table is called "data" with columns: ${columnInfo}. Return ONLY the SQL query, nothing else.`,
            },
            {
              role: "user",
              content: input.question,
            },
          ],
        });

        const sqlContent = sqlResponse.choices[0]?.message.content;
        const sqlQuery = typeof sqlContent === 'string' ? sqlContent.trim() : "";

        // Generate insights
        const insightsResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a data analyst. Provide brief, actionable insights based on the data.",
            },
            {
              role: "user",
              content: `Question: ${input.question}\n\nData summary: The dataset has ${dataset.rowCount} rows and ${dataset.columnCount} columns.`,
            },
          ],
        });

        const insightsContent = insightsResponse.choices[0]?.message.content;
        const insights = typeof insightsContent === 'string' ? insightsContent : "";

        // Determine chart type
        let chartType = "bar";
        if (input.question.toLowerCase().includes("trend") || input.question.toLowerCase().includes("over time")) {
          chartType = "line";
        } else if (input.question.toLowerCase().includes("distribution") || input.question.toLowerCase().includes("percentage")) {
          chartType = "pie";
        } else if (input.question.toLowerCase().includes("correlation") || input.question.toLowerCase().includes("scatter")) {
          chartType = "scatter";
        }

        // Save query
        const queryRecord = await db.createQuery({
          userId: ctx.user.id,
          datasetId: input.datasetId,
          question: input.question,
          sqlQuery,
          chartType,
          insights,
        });

        // Generate sample results based on the question
        const results = generateSampleResults(input.question, columns);

        return {
          success: true,
          queryId: (queryRecord as any).insertId,
          sqlQuery: sqlQuery || "",
          chartType,
          insights: insights || "",
          results: results,
        };
      }),
  }),

  // KPI procedures
  kpi: router({
    list: protectedProcedure
      .input(z.object({ datasetId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dataset = await db.getDatasetById(input.datasetId, ctx.user.id);
        if (!dataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }
        return db.getDatasetKPIs(input.datasetId, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        datasetId: z.number(),
        name: z.string().min(1),
        columnId: z.number(),
        metricType: z.enum(["sum", "avg", "count", "min", "max"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const dataset = await db.getDatasetById(input.datasetId, ctx.user.id);
        if (!dataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }

        const kpiRecord = await db.createKPI({
          userId: ctx.user.id,
          datasetId: input.datasetId,
          name: input.name,
          columnId: input.columnId,
          metricType: input.metricType,
          value: 0 as any,
        });

        return { success: true, kpiId: (kpiRecord as any).insertId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteKPI(input.id);
        return { success: true };
      }),
  }),

  // Report procedures
  report: router({
    list: protectedProcedure
      .input(z.object({ datasetId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dataset = await db.getDatasetById(input.datasetId, ctx.user.id);
        if (!dataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }
        return db.getUserReports(ctx.user.id, input.datasetId);
      }),

    create: protectedProcedure
      .input(z.object({
        datasetId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        chartIds: z.array(z.number()).optional(),
        kpiIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dataset = await db.getDatasetById(input.datasetId, ctx.user.id);
        if (!dataset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dataset not found" });
        }

        const reportRecord = await db.createReport({
          userId: ctx.user.id,
          datasetId: input.datasetId,
          name: input.name,
          description: input.description,
          chartIds: JSON.stringify(input.chartIds || []) as any,
          kpiIds: JSON.stringify(input.kpiIds || []) as any,
        });

        return { success: true, reportId: (reportRecord as any).insertId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const report = await db.getReportById(input.id, ctx.user.id);
        if (!report) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
        }
        await db.deleteReport(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
