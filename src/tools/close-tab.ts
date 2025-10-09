import { z } from "zod";
import type { MCPLogger } from "../mcp-logger.js";
import { attachBox } from "../sdk/index.js";

export const CLOSE_TAB_TOOL = "close_tab";

export const CLOSE_TAB_DESCRIPTION =
  "Close a browser tab by tab ID. Use list_tabs to get available tab IDs.";

export const closeTabParamsSchema = {
  boxId: z.string().describe("ID of the Linux/Browser box"),
  tabId: z.string().describe("ID of the tab to close"),
};

type CloseTabParams = z.infer<z.ZodObject<typeof closeTabParamsSchema>>;

export function handleCloseTab(logger: MCPLogger) {
  return async ({ boxId, tabId }: CloseTabParams) => {
    try {
      await logger.info("Close tab command invoked", { boxId, tabId });

      const box = await attachBox(boxId);

      // Check number of tabs before closing
      const tabInfo = await box.browser.listTabInfo();
      const tabCount = tabInfo.data?.length || 0;

      if (tabCount <= 1) {
        await logger.info("Cannot close last tab", { boxId, tabId, tabCount });
        return {
          content: [
            {
              type: "text" as const,
              text: `Cannot close tab ${tabId}: It is the last remaining tab. At least one tab must stay open.`,
            },
          ],
          isError: true,
        };
      }

      // Close tab
      await box.browser.closeTab(tabId);

      await logger.info("Browser tab closed", { boxId, tabId });

      return {
        content: [
          {
            type: "text" as const,
            text: `Tab ${tabId} closed successfully`,
          },
        ],
      };
    } catch (error) {
      await logger.error("Failed to close browser tab", {
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
