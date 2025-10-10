import { z } from "zod";
import GboxSDK from "gbox-sdk";
import { attachBox } from "../sdk/index.js";
import type { MCPLogger } from "../logger/logger.js";
import type { ActionPressKey, TimeString } from "gbox-sdk";
import { extractImageInfo } from "../sdk/utils.js";

export const PRESS_KEY_TOOL = "press_key";

export const PRESS_KEY_DESCRIPTION =
  "Simulates pressing a specific key by triggering the complete keyboard key event chain (keydown, keypress, keyup). Use this to activate keyboard key event listeners such as shortcuts or form submissions.";

// Extract supported keys type from SDK
type SupportedKey = ActionPressKey["keys"][number];

// Create supported keys array from SDK type - this ensures type safety with the SDK
const SUPPORTED_KEYS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "f1",
  "f2",
  "f3",
  "f4",
  "f5",
  "f6",
  "f7",
  "f8",
  "f9",
  "f10",
  "f11",
  "f12",
  "control",
  "alt",
  "shift",
  "meta",
  "win",
  "cmd",
  "option",
  "arrowUp",
  "arrowDown",
  "arrowLeft",
  "arrowRight",
  "home",
  "end",
  "pageUp",
  "pageDown",
  "enter",
  "space",
  "tab",
  "escape",
  "backspace",
  "delete",
  "insert",
  "capsLock",
  "numLock",
  "scrollLock",
  "pause",
  "printScreen",
  ";",
  "=",
  ",",
  "-",
  ".",
  "/",
  "`",
  "[",
  "\\",
  "]",
  "'",
  "numpad0",
  "numpad1",
  "numpad2",
  "numpad3",
  "numpad4",
  "numpad5",
  "numpad6",
  "numpad7",
  "numpad8",
  "numpad9",
  "numpadAdd",
  "numpadSubtract",
  "numpadMultiply",
  "numpadDivide",
  "numpadDecimal",
  "numpadEnter",
  "numpadEqual",
  "volumeUp",
  "volumeDown",
  "volumeMute",
  "mediaPlayPause",
  "mediaStop",
  "mediaNextTrack",
  "mediaPreviousTrack",
] as const satisfies readonly SupportedKey[];

export const pressKeyParamsSchema = {
  boxId: z.string().describe("ID of the box"),
  keys: z
    .array(z.enum(SUPPORTED_KEYS))
    .min(1)
    .describe(
      "Array of keyboard keys to press. Supports cross-platform compatibility. Can be single key like ['Enter'] or key combination like ['Control', 'c']"
    ),
  outputFormat: z
    .enum(["base64", "storageKey"])
    .default("base64")
    .optional()
    .describe("Output format for screenshot URIs (default 'base64')"),
  includeScreenshot: z
    .boolean()
    .default(false)
    .optional()
    .describe(
      "Whether to include screenshots in the action response. If false, the screenshot object will still be returned but with empty URIs. Default is false."
    ),
  screenshotDelay: z
    .string()
    .regex(/^[0-9]+(ms|s|m|h)$/)
    .default("500ms")
    .optional()
    .describe(
      "Delay after performing the action before taking the final screenshot. Supports time units: ms (milliseconds), s (seconds), m (minutes), h (hours). Example: '500ms', '30s', '5m', '1h'. Default: 500ms. Maximum allowed: 30s"
    ),
};

// Define parameter types - infer from the Zod schema
type PressKeyParams = z.infer<z.ZodObject<typeof pressKeyParamsSchema>>;

export function handlePressKey(logger: MCPLogger, gboxSDK: GboxSDK) {
  return async (args: PressKeyParams) => {
    try {
      const { boxId, keys, includeScreenshot, outputFormat, screenshotDelay } =
        args;
      await logger.info("Pressing keys", { boxId, keys: keys.join(" + ") });

      const box = await attachBox(boxId, gboxSDK);

      const result = await box.action.pressKey({
        keys: keys as ActionPressKey["keys"],
        options: {
          screenshot: includeScreenshot
            ? {
                phases: ["after"],
                outputFormat: outputFormat || "base64",
                delay: (screenshotDelay || "500ms") as TimeString,
              }
            : false,
        },
      });

      await logger.info("Keys pressed successfully", {
        boxId,
        keys: keys.join(" + "),
        imageCount: result?.screenshot?.after?.uri ? 1 : 0,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: "Keys pressed successfully",
          },
          ...(result?.screenshot?.after?.uri
            ? [
                {
                  type: "image" as const,
                  ...extractImageInfo(result.screenshot.after.uri),
                },
              ]
            : []),
        ],
      };
    } catch (error) {
      await logger.error("Failed to press keys", { boxId: args?.boxId, error });
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
