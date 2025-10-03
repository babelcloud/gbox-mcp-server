import { z } from "zod";
import type { MCPLogger } from "../mcp-logger.js";
import { attachBox } from "../sdk/index.js";
import { extractImageInfo } from "../sdk/utils.js";

export const CLICK_TOOL = "click";

export const CLICK_DESCRIPTION =
  "Click a UI element on the Linux desktop. Provide a clear description of the element to ensure it can be identified unambiguously.";

export const clickParamsSchema = {
  boxId: z.string().describe("ID of the Linux box"),
  target: z
    .string()
    .describe(
      "Description of the element to click (e.g. 'login button', 'search field', 'OK button'). MUST be detailed enough to identify the element unambiguously."
    ),
  button: z
    .enum(["left", "right", "middle"])
    .optional()
    .describe("Mouse button to click. Default is 'left'."),
  double: z
    .boolean()
    .optional()
    .describe("Whether to double click. Default is false."),
};

type ClickParams = z.infer<z.ZodObject<typeof clickParamsSchema>>;

export function handleClick(logger: MCPLogger) {
  return async ({ boxId, target, button, double }: ClickParams) => {
    try {
      await logger.info("Click command invoked", { boxId, target, button, double });

      const box = await attachBox(boxId);

      const result = await box.action.click({
        target,
        button,
        double,
        options: {
          screenshot: {
            phases: ["after"],
            outputFormat: "base64",
            delay: "500ms",
          },
        },
      });

      return {
        content: [
          {
            type: "text" as const,
            text: "Click action completed successfully",
          },
          {
            type: "image" as const,
            ...extractImageInfo(result.screenshot.after.uri),
          },
        ],
      };
    } catch (error) {
      await logger.error("Failed to run click action", {
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
