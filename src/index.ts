import { startStdioServer } from "./transport/stdio.js";
import { startStreamableHTTPServer } from "./transport/streamable-http.js";

const mode = process.env.MODE?.toLowerCase();

if (mode === "streamable" || mode === "cloud") {
  console.log("Starting MCP Server in Streamable HTTP mode...");
  startStreamableHTTPServer();
} else {
  startStdioServer().catch(error => {
    console.error("Failed to start STDIO server:", error);
    process.exit(1);
  });
}
