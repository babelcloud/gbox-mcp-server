import { z } from "zod";
import { attachBox } from "../sdk/index.js";
import type { MCPLogger } from "../logger/logger.js";
import { extractImageInfo } from "../sdk/utils.js";

export const TYPE_TOOL = "type";

export const TYPE_DESCRIPTION =
  "Type text content into the currently focused input. Optionally press Enter after typing, and choose to replace or append.";

export const typeParamsSchema = {
  boxId: z.string().describe("ID of the box"),
  content: z.string().describe("The text content to type."),
  pressEnterAfterType: z
    .boolean()
    .optional()
    .describe(
      "Whether to press the Enter key after typing the content. Defaults to false."
    ),
  replace: z
    .boolean()
    .optional()
    .describe(
      "If true, replace existing text; if false, append to the end of current text. Defaults to false."
    ),
};

type TypeParams = z.infer<z.ZodObject<typeof typeParamsSchema>>;

export function handleType(logger: MCPLogger) {
  return async ({
    boxId,
    content,
    pressEnterAfterType,
    replace,
  }: TypeParams) => {
    try {
      await logger.info("Typing content", {
        boxId,
        length: content.length,
        pressEnterAfterType: Boolean(pressEnterAfterType),
        replace: Boolean(replace),
      });

      const box = await attachBox(boxId);

      // First, type the content
      const typeResult = await box.action.type({
        pressEnter: pressEnterAfterType,
        text: content,
        mode: replace ? "replace" : "append",
        options: {
          screenshot: {
            phases: ["after"],
            outputFormat: "base64",
            delay: "500ms",
          },
        },
      });

      // Build response content
      const contentItems: Array<
        | { type: "text"; text: string }
        | { type: "image"; data: string; mimeType: string }
      > = [];

      // Add sanitized JSON of the final result
      contentItems.push({
        type: "text",
        text: "Text typed successfully",
      });

      // Prefer showing the final after screenshot if present
      contentItems.push({
        type: "image",
        ...extractImageInfo(typeResult.screenshot.after.uri),
      });

      return { content: contentItems };
    } catch (error) {
      await logger.error("Failed to type content", {
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
