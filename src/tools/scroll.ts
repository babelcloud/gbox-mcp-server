import { z } from "zod";
import GboxSDK from "gbox-sdk";
import type { MCPLogger } from "../logger/logger.js";
import { attachBox } from "../sdk/index.js";
import { extractImageInfo } from "../sdk/utils.js";

export const SCROLL_TOOL = "scroll";

export const SCROLL_DESCRIPTION =
  "Scroll the Linux desktop screen vertically. Scrolling is performed at the center of the screen.";

export const scrollParamsSchema = {
  boxId: z.string().describe("ID of the Linux box"),
  direction: z
    .enum(["up", "down"])
    .describe(
      "Direction to scroll. 'up' means scroll up to see more content above, 'down' means scroll down to see more content below."
    ),
  distance: z
    .enum(["tiny", "short", "medium", "long"])
    .optional()
    .default("medium")
    .describe("Scroll distance. Default is 'medium'."),
};

type ScrollParams = z.infer<z.ZodObject<typeof scrollParamsSchema>>;

// Distance multipliers based on gru-agent implementation
function getScrollAmount(
  distance: "tiny" | "short" | "medium" | "long"
): number {
  const amounts = {
    tiny: 1,
    short: 3,
    medium: 5,
    long: 10,
  };
  return amounts[distance];
}

export function handleScroll(logger: MCPLogger, gboxSDK: GboxSDK) {
  return async ({ boxId, direction, distance = "medium" }: ScrollParams) => {
    try {
      await logger.info("Scroll command invoked", {
        boxId,
        direction,
        distance,
      });

      const box = await attachBox(boxId, gboxSDK);

      // Get display resolution to calculate scroll position and amount
      const display = await box.display();
      const { width, height } = display.resolution;

      // Scroll at center of screen
      const scrollX = Math.round(width / 2);
      const scrollY = Math.round(height / 2);

      // Calculate scroll amount based on distance and screen height
      const scrollAmount = getScrollAmount(distance) * Math.round(height / 400);

      const result = await box.action.scroll({
        x: scrollX,
        y: scrollY,
        scrollX: 0,
        scrollY: direction === "up" ? -scrollAmount : scrollAmount,
        options: {
          screenshot: {
            phases: ["after"],
            outputFormat: "base64",
            delay: "300ms",
          },
        },
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Scrolled ${direction} by ${distance} distance`,
          },
          {
            type: "image" as const,
            ...extractImageInfo(result.screenshot.after.uri),
          },
        ],
      };
    } catch (error) {
      await logger.error("Failed to run scroll action", {
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
