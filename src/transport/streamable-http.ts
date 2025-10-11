import express from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { SessionManager, ServerConfig } from "../session/session-manager.js";
import { config } from "../config.js";
import { Platform } from "../types/platform.js";

/**
 * Streamable HTTP server for MCP sessions
 */
export class StreamableHTTPServer {
  private app: express.Application;
  private sessionManagers: Map<Platform, SessionManager> = new Map();

  constructor() {
    this.app = express();
    this.app.use(express.json());

    config.allPlatforms.forEach(platform => {
      const serverConfig: ServerConfig = {
        name: `gbox-${platform}`,
        version: "1.0.0",
        platform: platform,
        capabilities: {
          prompts: {},
          resources: {},
          tools: {},
          logging: {},
        },
        sessionTimeout: 120 * 60 * 1000,
        maxSessions: 1000,
      };
      this.sessionManagers.set(platform, new SessionManager(serverConfig));
    });

    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get("/healthz", (req, res) => {
      res.send("ok");
    });

    config.allPlatforms.forEach(platform => {
      const basePath = `/mcp/${platform}`;

      this.app.post(basePath, async (req, res) => {
        try {
          await this.handlePostRequest(req, res, platform);
        } catch (error) {
          console.error(`Error handling POST request for ${platform}:`, error);
          res.status(500).json({ error: "Internal server error" });
        }
      });

      this.app.get(basePath, async (req, res) => {
        try {
          await this.handleSessionRequest(req, res, platform);
        } catch (error) {
          console.error(`Error handling GET request for ${platform}:`, error);
          res.status(500).json({ error: "Internal server error" });
        }
      });

      this.app.delete(basePath, async (req, res) => {
        try {
          await this.handleSessionRequest(req, res, platform);
        } catch (error) {
          console.error(
            `Error handling DELETE request for ${platform}:`,
            error
          );
          res.status(500).json({ error: "Internal server error" });
        }
      });
    });
  }

  /**
   * Handle POST requests for client-to-server communication
   */
  private async handlePostRequest(
    req: express.Request,
    res: express.Response,
    platform: Platform
  ): Promise<void> {
    const sessionManager = this.sessionManagers.get(platform);
    if (!sessionManager) {
      res.status(400).json({ error: `Unsupported platform: ${platform}` });
      return;
    }

    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let session = sessionId ? sessionManager.getSession(sessionId) : undefined;

    if (session) {
      await session.transport.handleRequest(req, res, req.body);
    } else if (!sessionId && isInitializeRequest(req.body)) {
      const newSessionId = randomUUID();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: sessionId => {
          console.log(`Session initialized for ${platform}: ${sessionId}`);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          sessionManager.destroySession(transport.sessionId);
        }
      };

      session = await sessionManager.createSession(newSessionId, transport);

      await session.server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
      return;
    }
  }

  /**
   * Reusable handler for GET and DELETE requests
   */
  private async handleSessionRequest(
    req: express.Request,
    res: express.Response,
    platform: Platform
  ): Promise<void> {
    const sessionManager = this.sessionManagers.get(platform);
    if (!sessionManager) {
      res.status(400).json({ error: `Unsupported platform: ${platform}` });
      return;
    }

    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }

    await session.transport.handleRequest(req, res);
  }

  /**
   * Start the HTTP server
   */
  start(port: number = 3041): void {
    this.app.listen(port, () => {
      console.log(`Streamable HTTP MCP Server started on port ${port}`);
      console.log(`Health check: http://localhost:${port}/healthz`);
      config.allPlatforms.forEach(platform => {
        console.log(
          `${platform} endpoint: http://localhost:${port}/mcp/${platform}`
        );
      });
    });
  }

  /**
   * Stop the server and cleanup
   */
  stop(): void {
    this.sessionManagers.forEach(manager => manager.destroy());
    this.sessionManagers.clear();
  }
}

/**
 * Start the Streamable HTTP server
 */
export function startStreamableHTTPServer(): void {
  const port = parseInt(process.env.PORT || "3041", 10);
  const server = new StreamableHTTPServer();
  server.start(port);

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("Shutting down Streamable HTTP server...");
    server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("Shutting down Streamable HTTP server...");
    server.stop();
    process.exit(0);
  });
}
