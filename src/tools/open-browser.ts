import { z } from "zod";
import type { MCPLogger } from "../logger/logger.js";
import { attachBox } from "../sdk/index.js";
import { extractImageInfo } from "../sdk/utils.js";

export const OPEN_BROWSER_TOOL = "open_browser";

export const OPEN_BROWSER_DESCRIPTION =
  "Open the browser on the Linux desktop. Opens maximized if no browser is currently open.";

export const openBrowserParamsSchema = {
  boxId: z.string().describe("ID of the Linux box"),
};

type OpenBrowserParams = z.infer<z.ZodObject<typeof openBrowserParamsSchema>>;

export function handleOpenBrowser(logger: MCPLogger) {
  return async ({ boxId }: OpenBrowserParams) => {
    try {
      await logger.info("Open browser command invoked", { boxId });

      const box = await attachBox(boxId);

      // Open browser
      await box.browser.open({ maximize: true });

      await logger.info("Browser opened");

      // Wait for browser to fully open
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Take screenshot
      const screenshot = await box.action.screenshot({
        outputFormat: "base64",
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Browser opened successfully`,
          },
          {
            type: "image" as const,
            ...extractImageInfo(screenshot.uri),
          },
        ],
      };
    } catch (error) {
      await logger.error("Failed to open browser", {
        boxId,
        error,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  };
}
