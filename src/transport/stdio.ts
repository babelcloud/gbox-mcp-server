import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpServerFactory } from "../server/server-factory.js";
import { MCPLogger } from "../logger/logger.js";
import { config } from "../config.js";
import type { LogFn } from "../logger/types.js";
import type { LoggingMessageNotification } from "@modelcontextprotocol/sdk/types.js";
import { createDefaultGboxSDK } from "../sdk/client.js";
import GboxSDK from "gbox-sdk";

/**
 * STDIO server for MCP (singleton mode)
 */
class StdioServer {
  private mcpServer: McpServer;
  private logger: MCPLogger;
  private gboxSDK: GboxSDK;

  constructor() {
    // Create single McpServer instance
    this.mcpServer = McpServerFactory.createServer({
      name: `gbox-${config.platform}`,
      version: "1.0.0",
      platform: config.platform,
      capabilities: {
        prompts: {},
        resources: {},
        tools: {},
        logging: {},
      },
    });

    // Create logger that sends messages through MCP protocol
    const logFn: LogFn = async (
      params: LoggingMessageNotification["params"]
    ): Promise<void> => {
      await this.mcpServer.server.sendLoggingMessage(params);
    };

    this.logger = new MCPLogger(logFn);

    // Create global SDK instance
    this.gboxSDK = createDefaultGboxSDK();

    // Register tools and prompts
    McpServerFactory.registerTools(
      this.mcpServer,
      config.platform,
      this.logger,
      this.gboxSDK
    );
    McpServerFactory.registerPrompts(this.mcpServer);
  }

  /**
   * Start the STDIO server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
  }
}

// Export a function to start the STDIO server
export async function startStdioServer() {
  const server = new StdioServer();
  await server.start();
}
