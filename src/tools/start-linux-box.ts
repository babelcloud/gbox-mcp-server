import { z } from "zod";
import { CreateLinux } from "gbox-sdk";
import type { MCPLogger } from "../logger/logger.js";
import { openUrlInBrowser } from "../sdk/utils.js";
import GboxSDK from "gbox-sdk";

export const START_LINUX_BOX_TOOL = "start_linux_box";
export const START_LINUX_BOX_DESCRIPTION =
  "Start a GBOX(Linux) by the given ID. If the GBOX ID is not provided, a new virtual Linux GBOX will be created. MUST call this tool first when starting a task.";

export const startLinuxBoxParamsSchema = {
  gboxId: z
    .string()
    .optional()
    .describe(
      "The ID of the GBOX to start. If not provided, a new GBOX will be created."
    ),
};

type StartLinuxBoxParams = z.infer<
  z.ZodObject<typeof startLinuxBoxParamsSchema>
>;

export function handleStartLinuxBox(logger: MCPLogger, gboxSDK: GboxSDK) {
  return async (args: StartLinuxBoxParams) => {
    try {
      await logger.info("Starting Linux Box", args);

      let { gboxId } = args;

      let box;
      if (!gboxId) {
        // Create a new Linux box
        box = await gboxSDK.create({
          type: "linux",
        } as CreateLinux);
        gboxId = box.data?.id;
        await logger.info("Linux GBOX created successfully", {
          boxId: gboxId,
        });
      } else {
        box = await gboxSDK.get(gboxId);
      }

      await logger.info("Linux GBOX started successfully", {
        boxId: gboxId,
      });

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
      await logger.error("Failed to create Linux box", error);
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
