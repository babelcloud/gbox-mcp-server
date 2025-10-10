import { z } from "zod";
import GboxSDK from "gbox-sdk";
import { attachBox } from "../sdk/index.js";
import { MCPLogger } from "../logger/logger.js";
import type { ActionScreenshot } from "gbox-sdk";
import { extractImageInfo } from "../sdk/utils.js";

export const WAIT_TOOL = "wait";
export const WAIT_TOOL_DESCRIPTION =
  "Waits for a specified duration before next action. Useful when you need to wait for something to load or for an action to complete.";

export const waitParamsSchema = z.object({
  boxId: z.string().describe("ID of the box"),
  duration: z
    .number()
    .int()
    .positive()
    .describe("The duration to wait in milliseconds."),
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function handleWait(logger: MCPLogger, gboxSDK: GboxSDK) {
  return async ({ boxId, duration }: z.infer<typeof waitParamsSchema>) => {
    // Wait the specified duration
    await sleep(duration);

    // Capture screenshot after waiting
    try {
      const box = await attachBox(boxId, gboxSDK);
      const screenshotParams: ActionScreenshot = { outputFormat: "base64" };
      const { uri } = await box.action.screenshot(screenshotParams);

      const message = `Finished waiting for ${duration}ms.`;
      await logger.info(message);

      return {
        content: [
          {
            type: "text" as const,
            text: message,
          },
          {
            type: "image" as const,
            ...extractImageInfo(uri),
          },
        ],
      };
    } catch (error) {
      // If screenshot fails, still return wait text with error information
      const message = `Finished waiting for ${duration}ms, but failed to capture screenshot.`;
      await logger.error("Failed to capture screenshot after wait", {
        boxId,
        error,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: message,
          },
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
