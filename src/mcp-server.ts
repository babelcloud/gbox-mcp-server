import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "./config.js";
import { MCPLogger } from "./mcp-logger.js";
import type { LogFn } from "./types.js";
import type { LoggingMessageNotification } from "@modelcontextprotocol/sdk/types.js";
import { gboxManualTpl } from "./prompts/gbox-manual.js";
import {
  handleScreenshot,
  SCREENSHOT_DESCRIPTION,
  SCREENSHOT_TOOL,
  screenshotParamsSchema,
} from "./tools/screenshot.js";
import {
  DRAG_DESCRIPTION,
  DRAG_TOOL,
  dragParamsSchema,
  handleDrag,
} from "./tools/drag.js";
import {
  handleTap,
  TAP_DESCRIPTION,
  TAP_TOOL,
  tapParamsSchema,
} from "./tools/tap.js";
import {
  handleType,
  TYPE_DESCRIPTION,
  TYPE_TOOL,
  typeParamsSchema,
} from "./tools/type.js";
import {
  handleSwipe,
  SWIPE_DESCRIPTION,
  SWIPE_TOOL,
  swipeParamsSchema,
} from "./tools/swipe.js";
import {
  handleWait,
  WAIT_TOOL,
  WAIT_TOOL_DESCRIPTION,
  waitParamsSchema,
} from "./tools/wait.js";
import {
  CLOSE_APP_DESCRIPTION,
  CLOSE_APP_TOOL,
  closeAppParamsSchema,
  handleCloseApp,
  handleInstallApk,
  handleOpenApp,
  INSTALL_APK_DESCRIPTION,
  INSTALL_APK_TOOL,
  installApkParamsSchema,
  OPEN_APP_DESCRIPTION,
  OPEN_APP_TOOL,
  openAppParamsSchema,
} from "./tools/apk-management.js";
import {
  handlePressButton,
  PRESS_BUTTON_DESCRIPTION,
  PRESS_BUTTON_TOOL,
  pressButtonParamsSchema,
} from "./tools/press-button.js";
import {
  handleStartAndroidBox,
  START_ANDROID_BOX_DESCRIPTION,
  START_ANDROID_BOX_TOOL,
  startAndroidBoxParamsSchema,
} from "./tools/start-android-box.js";
import {
  handleLongPress,
  LONG_PRESS_DESCRIPTION,
  LONG_PRESS_TOOL,
  longPressParamsSchema,
} from "./tools/long-press.js";
import {
  handleClick,
  CLICK_DESCRIPTION,
  CLICK_TOOL,
  clickParamsSchema,
} from "./tools/click.js";
import {
  handleScroll,
  SCROLL_DESCRIPTION,
  SCROLL_TOOL,
  scrollParamsSchema,
} from "./tools/scroll.js";
import {
  handleOpenBrowser,
  OPEN_BROWSER_DESCRIPTION,
  OPEN_BROWSER_TOOL,
  openBrowserParamsSchema,
} from "./tools/open-browser.js";
import {
  handlePressKey,
  PRESS_KEY_DESCRIPTION,
  PRESS_KEY_TOOL,
  pressKeyParamsSchema,
} from "./tools/press-key.js";
import {
  handleStartLinuxBox,
  START_LINUX_BOX_DESCRIPTION,
  START_LINUX_BOX_TOOL,
  startLinuxBoxParamsSchema,
} from "./tools/start-linux-box.js";

const isSse = config.mode === "sse";
const isAndroid = config.platform === "android";
const isLinux = config.platform === "linux";

// Create MCP server instance
const mcpServer = new McpServer(
  {
    name: `gbox-${config.platform}`,
    version: "1.0.0",
  },
  {
    capabilities: {
      prompts: {},
      resources: {},
      tools: {},
      ...(!isSse ? { logging: {} } : {}),
    },
  }
);

const log: LogFn = async (
  params: LoggingMessageNotification["params"]
): Promise<void> => {
  if (isSse) {
    if (params.level === "debug") {
      console.debug(params.data);
    } else if (params.level === "info") {
      console.info(params.data);
    } else if (params.level === "warning") {
      console.warn(params.data);
    } else if (params.level === "error") {
      console.error(params.data);
    } else if (params.level === "notice") {
      console.log(params.data);
    } else if (params.level === "critical") {
      console.error(params.data);
    } else if (params.level === "alert") {
      console.warn(params.data);
    } else if (params.level === "emergency") {
      console.warn(params.data);
    } else if (params.level === "trace") {
      console.trace(params.data);
    } else {
      console.log(params.data);
    }
  } else {
    await mcpServer.server.sendLoggingMessage(params);
  }
};

// Create logger instance
const logger = new MCPLogger(log);

// Add prompt for APK testing rules
const GBOX_MANUAL = "gbox-manual";
const GBOX_MANUAL_DESCRIPTION = "Gbox Usage Guide";

mcpServer.prompt(GBOX_MANUAL, GBOX_MANUAL_DESCRIPTION, () => {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: gboxManualTpl,
        },
      },
    ],
  };
});

// Register tools with Zod schemas

// Common tools for both platforms
mcpServer.tool(
  WAIT_TOOL,
  WAIT_TOOL_DESCRIPTION,
  waitParamsSchema.shape,
  handleWait(logger)
);

mcpServer.tool(
  SCREENSHOT_TOOL,
  SCREENSHOT_DESCRIPTION,
  screenshotParamsSchema,
  handleScreenshot(logger)
);

mcpServer.tool(
  DRAG_TOOL,
  DRAG_DESCRIPTION,
  dragParamsSchema,
  handleDrag(logger)
);

mcpServer.tool(
  TYPE_TOOL,
  TYPE_DESCRIPTION,
  typeParamsSchema,
  handleType(logger)
);

mcpServer.tool(
  LONG_PRESS_TOOL,
  LONG_PRESS_DESCRIPTION,
  longPressParamsSchema,
  handleLongPress(logger)
);

// Android-specific tools
if (isAndroid) {
  mcpServer.tool(
    START_ANDROID_BOX_TOOL,
    START_ANDROID_BOX_DESCRIPTION,
    startAndroidBoxParamsSchema,
    handleStartAndroidBox(logger)
  );

  mcpServer.tool(
    OPEN_APP_TOOL,
    OPEN_APP_DESCRIPTION,
    openAppParamsSchema,
    handleOpenApp(logger)
  );

  mcpServer.tool(
    CLOSE_APP_TOOL,
    CLOSE_APP_DESCRIPTION,
    closeAppParamsSchema,
    handleCloseApp(logger)
  );

  mcpServer.tool(
    INSTALL_APK_TOOL,
    INSTALL_APK_DESCRIPTION,
    installApkParamsSchema,
    handleInstallApk(logger)
  );

  mcpServer.tool(
    PRESS_BUTTON_TOOL,
    PRESS_BUTTON_DESCRIPTION,
    pressButtonParamsSchema,
    handlePressButton(logger)
  );

  mcpServer.tool(
    SWIPE_TOOL,
    SWIPE_DESCRIPTION,
    swipeParamsSchema,
    handleSwipe(logger)
  );

  mcpServer.tool(TAP_TOOL, TAP_DESCRIPTION, tapParamsSchema, handleTap(logger));
}

// Linux-specific tools
if (isLinux) {
  mcpServer.tool(
    START_LINUX_BOX_TOOL,
    START_LINUX_BOX_DESCRIPTION,
    startLinuxBoxParamsSchema,
    handleStartLinuxBox(logger)
  );

  mcpServer.tool(
    CLICK_TOOL,
    CLICK_DESCRIPTION,
    clickParamsSchema,
    handleClick(logger)
  );

  mcpServer.tool(
    SCROLL_TOOL,
    SCROLL_DESCRIPTION,
    scrollParamsSchema,
    handleScroll(logger)
  );

  mcpServer.tool(
    OPEN_BROWSER_TOOL,
    OPEN_BROWSER_DESCRIPTION,
    openBrowserParamsSchema,
    handleOpenBrowser(logger)
  );

  mcpServer.tool(
    PRESS_KEY_TOOL,
    PRESS_KEY_DESCRIPTION,
    pressKeyParamsSchema,
    handlePressKey(logger)
  );

}

// mcpServer.tool(
//   UNINSTALL_APK_TOOL,
//   UNINSTALL_APK_DESCRIPTION,
//   uninstallApkParamsSchema,
//   handleUninstallApk(logger)
// );

// mcpServer.tool(
//   PRESS_KEY_TOOL,
//   PRESS_KEY_DESCRIPTION,
//   pressKeyParamsSchema,
//   handlePressKey(logger)
// );

// mcpServer.tool(
//   TYPE_TEXT_TOOL,
//   TYPE_TEXT_DESCRIPTION,
//   typeTextParamsSchema,
//   handleTypeText(logger)
// );

// mcpServer.tool(
//   LOGCAT_TOOL,
//   LOGCAT_DESCRIPTION,
//   logcatParamsSchema,
//   handleLogcat(logger)
// );

// mcpServer.tool(
//   ADB_SHELL_TOOL,
//   ADB_SHELL_DESCRIPTION,
//   adbShellParamsSchema,
//   handleAdbShell(logger)
// );

export { mcpServer, logger };
