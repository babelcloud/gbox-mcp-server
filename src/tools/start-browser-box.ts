import { z } from "zod";
import { CreateLinux } from "gbox-sdk";
import { gboxSDK } from "../sdk/index.js";
import type { MCPLogger } from "../logger/logger.js";
import { openUrlInBrowser } from "../sdk/utils.js";

export const START_BROWSER_BOX_TOOL = "start_browser_box";
export const START_BROWSER_BOX_DESCRIPTION =
  "Start a GBOX(Browser) by the given ID with browser pre-opened and maximized. If the GBOX ID is not provided, a new virtual Linux GBOX will be created with browser. MUST call this tool first when starting a task.";

export const startBrowserBoxParamsSchema = {
  gboxId: z
    .string()
    .optional()
    .describe(
      "The ID of the GBOX to start. If not provided, a new GBOX will be created."
    ),
};

type StartBrowserBoxParams = z.infer<
  z.ZodObject<typeof startBrowserBoxParamsSchema>
>;

export function handleStartBrowserBox(logger: MCPLogger) {
  return async (args: StartBrowserBoxParams) => {
    try {
      await logger.info("Starting Browser Box", args);

      let { gboxId } = args;

      let box;
      if (!gboxId) {
        // Create a new Linux box
        box = await gboxSDK.create({
          type: "linux",
        } as CreateLinux);
        gboxId = box.data?.id;
        await logger.info("Browser GBOX created successfully", {
          boxId: gboxId,
        });
      } else {
        box = await gboxSDK.get(gboxId);
      }

      // Open browser maximized with no controls
      await logger.info("Opening browser maximized", { boxId: gboxId });
      await box.browser.open({
        maximize: true,
        showControls: false,
      });
      await logger.info("Browser opened successfully", { boxId: gboxId });

      const result = {
        success: false,
        boxId: "",
        liveViewUrl: "",
      };

      if (box) {
        const liveViewUrl = await box.liveView();
        await logger.info("Live view created successfully", {
          boxId: gboxId,
          url: liveViewUrl.url,
        });

        // Open live view in browser
        openUrlInBrowser(liveViewUrl.url);

        result.success = true;
        result.boxId = gboxId;
        result.liveViewUrl = liveViewUrl.url;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      await logger.error("Failed to create Browser box", error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  };
}
