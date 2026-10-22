import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

export function registerOAuthRoutes(app: Express) {
  // Local development auth bypass route
  app.get("/app-auth", async (req: Request, res: Response) => {
    try {
      const mockOpenId = "local-dev-user-123";
      
      // Upsert a mock user into your local database so the app recognizes you
      await db.upsertUser({
        openId: mockOpenId,
        name: "Local Developer",
        email: "developer@local.test",
        loginMethod: "development",
        lastSignedIn: new Date(),
      });

      // Create a valid session token using the project SDK
      const sessionToken = await sdk.createSessionToken(mockOpenId, {
        name: "Local Developer",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set the session cookie and redirect to the dashboard
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return res.redirect(302, "/dashboard");
    } catch (error) {
      console.error("[Auth Bypass] Failed to login local user:", error);
      return res.redirect(302, "/dashboard");
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    return res.redirect(302, "/dashboard");
  });
}