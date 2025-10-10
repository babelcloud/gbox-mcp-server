import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Session } from "./session.js";
import { McpServerFactory } from "../server/server-factory.js";
import { MCPLogger } from "../logger/logger.js";
import type { LogFn } from "../logger/types.js";
import { createGboxSDK } from "../sdk/client.js";
import { ClientOptions } from "gbox-sdk";

export interface ServerConfig {
  name: string;
  version: string;
  platform: "android" | "linux" | "browser";
  capabilities: {
    prompts: Record<string, never>;
    resources: Record<string, never>;
    tools: Record<string, never>;
    logging: Record<string, never>;
  };
  sessionTimeout?: number;
  maxSessions?: number;
}

/**
 * Manages MCP sessions for Streamable HTTP transport
 */
export class SessionManager {
  private sessions = new Map<string, Session>();
  private config: ServerConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: ServerConfig) {
    this.config = {
      sessionTimeout: 120 * 60 * 1000, // 120 minutes default
      maxSessions: 1000, // 1000 sessions default
      ...config,
    };
  }

  /**
   * Create a new session
   */
  async createSession(
    sessionId: string,
    transport: StreamableHTTPServerTransport,
    userConfig?: ClientOptions
  ): Promise<Session> {
    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      const existingSession = this.sessions.get(sessionId)!;
      existingSession.updateActivity();
      return existingSession;
    }

    // Check max sessions limit
    if (this.sessions.size >= (this.config.maxSessions || 10000)) {
      throw new Error("Maximum number of sessions reached");
    }

    // Create new McpServer instance
    const server = McpServerFactory.createServer(this.config, sessionId);

    // Create logger for this session
    const logFn: LogFn = async params => {
      switch (params.level) {
        case "debug":
          console.debug(params.data);
          break;
        case "info":
          console.info(params.data);
          break;
        case "warning":
          console.warn(params.data);
          break;
        case "error":
          console.error(params.data);
          break;
        case "notice":
          console.log(params.data);
          break;
        case "critical":
          console.error(params.data);
          break;
        case "alert":
          console.warn(params.data);
          break;
        case "emergency":
          console.warn(params.data);
          break;
        default:
          console.log(params.data);
          break;
      }
    };
    const logger = new MCPLogger(logFn);

    // Create SDK instance for this session
    const gboxSDK = createGboxSDK(userConfig || {});

    // Register tools and prompts
    McpServerFactory.registerTools(
      server,
      this.config.platform,
      logger,
      gboxSDK
    );
    McpServerFactory.registerPrompts(server);

    // Create session
    const session = new Session(
      sessionId,
      server,
      transport,
      logger,
      gboxSDK,
      this.config.platform
    );
    this.sessions.set(sessionId, session);

    // Start cleanup timer if not already started
    if (!this.cleanupTimer) {
      this.startCleanupTimer();
    }

    return session;
  }

  /**
   * Get an existing session
   */
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.updateActivity();
    }
    return session;
  }

  /**
   * Destroy a session
   */
  destroySession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Cleanup resources if needed
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get active session count
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Start cleanup timer for expired sessions
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // Check every minute
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const timeout = this.config.sessionTimeout || 120 * 60 * 1000;
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (session.isExpired(timeout)) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.destroySession(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Stop cleanup timer and destroy all sessions
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // Destroy all sessions
    for (const sessionId of this.sessions.keys()) {
      this.destroySession(sessionId);
    }
  }
}
