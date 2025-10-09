import { z } from "zod";
import type { MCPLogger } from "../mcp-logger.js";
import { attachBox } from "../sdk/index.js";
import { extractImageInfo } from "../sdk/utils.js";

export const SWITCH_TAB_TOOL = "switch_tab";

export const SWITCH_TAB_DESCRIPTION =
  "Switch to a different browser tab by tab ID. Use list_tabs to get available tab IDs.";

export const switchTabParamsSchema = {
  boxId: z.string().describe("ID of the Linux/Browser box"),
  tabId: z.string().describe("ID of the tab to switch to"),
};

type SwitchTabParams = z.infer<z.ZodObject<typeof switchTabParamsSchema>>;

export function handleSwitchTab(logger: MCPLogger) {
  return async ({ boxId, tabId }: SwitchTabParams) => {
    try {
      await logger.info("Switch tab command invoked", { boxId, tabId });

      const box = await attachBox(boxId);

      // Switch to tab
      await box.browser.switchTab(tabId);

      await logger.info("Switched to browser tab", { boxId, tabId });

      // Wait a moment for tab to become active
      await new Promise(resolve => setTimeout(resolve, 500));

      // Take screenshot
      const screenshot = await box.action.screenshot({
        outputFormat: "base64",
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Switched to tab ${tabId} successfully`,
          },
          {
            type: "image" as const,
            ...extractImageInfo(screenshot.uri),
          },
        ],
      };
    } catch (error) {
      await logger.error("Failed to switch browser tab", {
        boxId,
        tabId,
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
