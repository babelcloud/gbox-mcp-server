import express from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { SessionManager, ServerConfig } from "../session/session-manager.js";
import { config } from "../config.js";

/**
 * Streamable HTTP server for MCP sessions
 */
export class StreamableHTTPServer {
  private app: express.Application;
  private sessionManager: SessionManager;

  constructor() {
    this.app = express();
    this.app.use(express.json());

    // Create session manager
    const serverConfig: ServerConfig = {
      name: `gbox-${config.platform}`,
      version: "1.0.0",
      platform: config.platform,
      capabilities: {
        prompts: {},
        resources: {},
        tools: {},
        logging: {},
      },
      sessionTimeout: 120 * 60 * 1000, // 120 minutes
      maxSessions: 1000,
    };

    this.sessionManager = new SessionManager(serverConfig);
    this.setupRoutes();
  }

  /**
   * Setup HTTP routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        activeSessions: this.sessionManager.getActiveSessionCount(),
        platform: config.platform,
      });
    });

    // Handle POST requests for client-to-server communication
    this.app.post("/mcp", async (req, res) => {
      try {
        await this.handlePostRequest(req, res);
      } catch (error) {
        console.error("Error handling POST request:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Handle GET requests for server-to-client notifications via SSE
    this.app.get("/mcp", async (req, res) => {
      try {
        await this.handleSessionRequest(req, res);
      } catch (error) {
        console.error("Error handling GET request:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Handle DELETE requests for session termination
    this.app.delete("/mcp", async (req, res) => {
      try {
        await this.handleSessionRequest(req, res);
      } catch (error) {
        console.error("Error handling DELETE request:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
  }

  /**
   * Handle POST requests for client-to-server communication
   */
  private async handlePostRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    // Check for existing session ID
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let session = sessionId
      ? this.sessionManager.getSession(sessionId)
      : undefined;

    if (session) {
      // Reuse existing session
      await session.transport.handleRequest(req, res, req.body);
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      const newSessionId = randomUUID();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: sessionId => {
          // Session will be stored by SessionManager
          console.log(`Session initialized: ${sessionId}`);
        },
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          this.sessionManager.destroySession(transport.sessionId);
        }
      };

      // Create new session
      session = await this.sessionManager.createSession(
        newSessionId,
        transport
      );

      // Connect to the MCP server
      await session.server.connect(transport);

      // Handle the request
      await transport.handleRequest(req, res, req.body);
    } else {
      // Invalid request
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
    res: express.Response
  ): Promise<void> {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }

    const session = this.sessionManager.getSession(sessionId);
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
      console.log(`Platform: ${config.platform}`);
      console.log(`Health check: http://localhost:${port}/health`);
      console.log(`MCP endpoint: http://localhost:${port}/mcp`);
    });
  }

  /**
   * Stop the server and cleanup
   */
  stop(): void {
    this.sessionManager.destroy();
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
