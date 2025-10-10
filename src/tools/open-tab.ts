import { z } from "zod";
import GboxSDK from "gbox-sdk";
import type { MCPLogger } from "../logger/logger.js";
import { attachBox } from "../sdk/index.js";
import { extractImageInfo } from "../sdk/utils.js";

export const OPEN_TAB_TOOL = "open_tab";

export const OPEN_TAB_DESCRIPTION =
  "Open a new browser tab with the specified URL.";

export const openTabParamsSchema = {
  boxId: z.string().describe("ID of the Linux/Browser box"),
  url: z.string().describe("URL to open in the new tab"),
};

type OpenTabParams = z.infer<z.ZodObject<typeof openTabParamsSchema>>;

export function handleOpenTab(logger: MCPLogger, gboxSDK: GboxSDK) {
  return async ({ boxId, url }: OpenTabParams) => {
    try {
      await logger.info("Open tab command invoked", { boxId, url });

      const box = await attachBox(boxId, gboxSDK);

      // Open new tab
      const result = await box.browser.openTab(url);

      await logger.info("Browser tab opened", {
        boxId,
        url,
        tabId: result.id,
      });

      // Wait a moment for tab to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Take screenshot
      const screenshot = await box.action.screenshot({
        outputFormat: "base64",
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Tab opened successfully. Tab ID: ${result.id}`,
          },
          {
            type: "image" as const,
            ...extractImageInfo(screenshot.uri),
          },
        ],
      };
    } catch (error) {
      await logger.error("Failed to open browser tab", {
        boxId,
        url,
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
