import { z } from "zod";
import type { MCPLogger } from "../logger/logger.js";
import { attachBox } from "../sdk/index.js";

export const LIST_TABS_TOOL = "list_tabs";

export const LIST_TABS_DESCRIPTION =
  "List all browser tabs currently open in the browser. Returns tab information including tab ID, title, and URL.";

export const listTabsParamsSchema = {
  boxId: z.string().describe("ID of the Linux/Browser box"),
};

type ListTabsParams = z.infer<z.ZodObject<typeof listTabsParamsSchema>>;

export function handleListTabs(logger: MCPLogger) {
  return async ({ boxId }: ListTabsParams) => {
    try {
      await logger.info("List tabs command invoked", { boxId });

      const box = await attachBox(boxId);

      // Get tab information
      const tabInfo = await box.browser.listTabInfo();

      await logger.info("Browser tabs retrieved", {
        boxId,
        tabCount: tabInfo.data?.length || 0,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(tabInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      await logger.error("Failed to list browser tabs", {
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
