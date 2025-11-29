import { z } from "zod";
import GboxSDK from "gbox-sdk";
import type { MCPLogger } from "../logger/logger.js";
import { attachBox } from "../sdk/index.js";
import { extractImageInfo } from "../sdk/utils.js";

export const HOVER_TOOL = "hover";

export const HOVER_DESCRIPTION =
  "Hover over a UI element on the browser using natural language description. The element will be detected automatically and the mouse will move to it without clicking.";

export const hoverParamsSchema = {
  boxId: z.string().describe("ID of the browser box"),
  target: z
    .string()
    .describe(
      "Description of the element to hover over (e.g. 'login button', 'search field', 'submit button'). MUST be detailed enough to identify the element unambiguously."
    ),
};

type HoverParams = z.infer<z.ZodObject<typeof hoverParamsSchema>>;

/**
 * Call GBOX Handy API to detect element coordinates using SDK
 * @throws Error if element detection fails or element not found
 */
async function detectElementWithHandy(
  screenshotUri: string,
  target: string,
  logger: MCPLogger,
  gboxSDK: GboxSDK
): Promise<{ x: number; y: number }> {
  try {
    await logger.debug("Calling GBOX Handy API", {
      target,
    });

    const result = await gboxSDK.model.call({
      model: "gbox-handy-1",
      screenshot: screenshotUri,
      action: {
        type: "click",
        target: target,
      },
    });

    // Check if response is a click action
    if (result.response.type !== "click") {
      await logger.error("GBOX Handy returned unexpected action type", {
        target,
        responseType: result.response.type,
        requestId: result.id,
      });
      throw new Error(
        `GBOX Handy returned unexpected action type: ${result.response.type}`
      );
    }

    const clickCoords = result.response.coordinates as { x: number; y: number };

    // Check if coordinates are valid (not -1, -1 which indicates no target found)
    if (clickCoords.x === -1 && clickCoords.y === -1) {
      await logger.info("GBOX Handy could not find element", {
        target,
        requestId: result.id,
      });
      throw new Error(
        `Element not found: "${target}". Please provide a more specific description.`
      );
    }

    const coordinates = {
      x: Math.round(clickCoords.x),
      y: Math.round(clickCoords.y),
    };

    await logger.info("GBOX Handy detected element", {
      target,
      coordinates,
      requestId: result.id,
    });

    return coordinates;
  } catch (error) {
    await logger.error("GBOX Handy detection failed", {
      error: error instanceof Error ? error.message : String(error),
      target,
    });
    throw error;
  }
}

export function handleHover(logger: MCPLogger, gboxSDK: GboxSDK) {
  return async ({ boxId, target }: HoverParams) => {
    const startTime = Date.now();

    try {
      await logger.info("Hover command invoked", {
        boxId,
        target,
        timestamp: new Date().toISOString(),
      });

      // Step 1: Attach to box
      const boxAttachStart = Date.now();
      const box = await attachBox(boxId, gboxSDK);
      const boxAttachDuration = Date.now() - boxAttachStart;

      await logger.debug("Box attached successfully", {
        boxId,
        attachDurationMs: boxAttachDuration,
      });

      // Step 2: Take screenshot
      await logger.debug("Taking screenshot for element detection");
      const screenshotResult = await box.action.screenshot({
        outputFormat: "base64",
      });

      if (!screenshotResult || !screenshotResult.uri) {
        throw new Error("Failed to capture screenshot");
      }

      // Step 3: Detect element with GBOX Handy using base64 screenshot
      const coordinates = await detectElementWithHandy(
        screenshotResult.uri,
        target,
        logger,
        gboxSDK
      );

      // Step 4: Execute move action with coordinates
      await logger.debug("Moving mouse to coordinates", {
        coordinates,
        target,
      });

      const moveResult = await box.action.move({
        x: coordinates.x,
        y: coordinates.y,
        options: {
          screenshot: {
            phases: ["after"],
            outputFormat: "base64",
            delay: "500ms",
          },
        },
      });

      const totalDuration = Date.now() - startTime;

      await logger.info("Hover action completed successfully", {
        boxId,
        target,
        coordinates,
        totalDurationMs: totalDuration,
        actionId: moveResult.actionId,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Hover action completed successfully. Moved to "${target}" at (${coordinates.x}, ${coordinates.y})`,
          },
          {
            type: "image" as const,
            ...extractImageInfo(moveResult.screenshot.after.uri),
          },
        ],
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;

      const errorDetails: Record<string, unknown> = {
        boxId,
        target,
        totalDurationMs: totalDuration,
        timestamp: new Date().toISOString(),
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
      };

      if (error && typeof error === "object") {
        if ("status" in error)
          errorDetails.httpStatus = (error as { status: unknown }).status;
        if ("stack" in error) errorDetails.stack = (error as Error).stack;
      }

      await logger.error("Failed to run hover action", errorDetails);

      let userMessage = `Error: ${error instanceof Error ? error.message : String(error)}`;
      if (errorDetails.httpStatus) {
        userMessage += ` (HTTP ${errorDetails.httpStatus})`;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: userMessage,
          },
        ],
        isError: true,
      };
    }
  };
}
