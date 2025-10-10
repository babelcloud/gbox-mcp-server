import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { MCPLogger } from "../logger/logger.js";

/**
 * Represents a single MCP session for Streamable HTTP transport
 */
export class Session {
  readonly id: string;
  readonly server: McpServer;
  readonly transport: StreamableHTTPServerTransport;
  readonly logger: MCPLogger;
  readonly createdAt: Date;
  lastActivityAt: Date;
  readonly platform: "android" | "linux" | "browser";

  constructor(
    id: string,
    server: McpServer,
    transport: StreamableHTTPServerTransport,
    logger: MCPLogger,
    platform: "android" | "linux" | "browser"
  ) {
    this.id = id;
    this.server = server;
    this.transport = transport;
    this.logger = logger;
    this.platform = platform;
    this.createdAt = new Date();
    this.lastActivityAt = new Date();
  }

  /**
   * Update the last activity timestamp
   */
  updateActivity(): void {
    this.lastActivityAt = new Date();
  }

  /**
   * Check if the session is expired
   */
  isExpired(timeoutMs: number): boolean {
    return Date.now() - this.lastActivityAt.getTime() > timeoutMs;
  }

  /**
   * Get session age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.createdAt.getTime();
  }
}
