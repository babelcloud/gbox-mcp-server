import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MCPLogger } from "../logger/logger.js";
import { gboxManualTpl } from "../prompts/gbox-manual.js";

// Import all tools
import {
  handleScreenshot,
  SCREENSHOT_DESCRIPTION,
  SCREENSHOT_TOOL,
  screenshotParamsSchema,
} from "../tools/screenshot.js";
import {
  DRAG_DESCRIPTION,
  DRAG_TOOL,
  dragParamsSchema,
  handleDrag,
} from "../tools/drag.js";
import {
  handleTap,
  TAP_DESCRIPTION,
  TAP_TOOL,
  tapParamsSchema,
} from "../tools/tap.js";
import {
  handleType,
  TYPE_DESCRIPTION,
  TYPE_TOOL,
  typeParamsSchema,
} from "../tools/type.js";
import {
  handleSwipe,
  SWIPE_DESCRIPTION,
  SWIPE_TOOL,
  swipeParamsSchema,
} from "../tools/swipe.js";
import {
  handleWait,
  WAIT_TOOL,
  WAIT_TOOL_DESCRIPTION,
  waitParamsSchema,
} from "../tools/wait.js";
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
} from "../tools/apk-management.js";
import {
  handlePressButton,
  PRESS_BUTTON_DESCRIPTION,
  PRESS_BUTTON_TOOL,
  pressButtonParamsSchema,
} from "../tools/press-button.js";
import {
  handleStartAndroidBox,
  START_ANDROID_BOX_DESCRIPTION,
  START_ANDROID_BOX_TOOL,
  startAndroidBoxParamsSchema,
} from "../tools/start-android-box.js";
import {
  handleLongPress,
  LONG_PRESS_DESCRIPTION,
  LONG_PRESS_TOOL,
  longPressParamsSchema,
} from "../tools/long-press.js";
import {
  handleClick,
  CLICK_DESCRIPTION,
  CLICK_TOOL,
  clickParamsSchema,
} from "../tools/click.js";
import {
  handleScroll,
  SCROLL_DESCRIPTION,
  SCROLL_TOOL,
  scrollParamsSchema,
} from "../tools/scroll.js";
import {
  handleOpenBrowser,
  OPEN_BROWSER_DESCRIPTION,
  OPEN_BROWSER_TOOL,
  openBrowserParamsSchema,
} from "../tools/open-browser.js";
import {
  handlePressKey,
  PRESS_KEY_DESCRIPTION,
  PRESS_KEY_TOOL,
  pressKeyParamsSchema,
} from "../tools/press-key.js";
import {
  handleStartLinuxBox,
  START_LINUX_BOX_DESCRIPTION,
  START_LINUX_BOX_TOOL,
  startLinuxBoxParamsSchema,
} from "../tools/start-linux-box.js";
import {
  handleStartBrowserBox,
  START_BROWSER_BOX_DESCRIPTION,
  START_BROWSER_BOX_TOOL,
  startBrowserBoxParamsSchema,
} from "../tools/start-browser-box.js";
import {
  handleListTabs,
  LIST_TABS_DESCRIPTION,
  LIST_TABS_TOOL,
  listTabsParamsSchema,
} from "../tools/list-tabs.js";
import {
  handleOpenTab,
  OPEN_TAB_DESCRIPTION,
  OPEN_TAB_TOOL,
  openTabParamsSchema,
} from "../tools/open-tab.js";
import {
  handleSwitchTab,
  SWITCH_TAB_DESCRIPTION,
  SWITCH_TAB_TOOL,
  switchTabParamsSchema,
} from "../tools/switch-tab.js";
import {
  handleCloseTab,
  CLOSE_TAB_DESCRIPTION,
  CLOSE_TAB_TOOL,
  closeTabParamsSchema,
} from "../tools/close-tab.js";

/**
 * Factory class for creating McpServer instances
 */
export class McpServerFactory {
  /**
   * Create a new McpServer instance
   */
  static createServer(
    config: {
      name: string;
      version: string;
      platform: "android" | "linux" | "browser";
      capabilities: {
        prompts: Record<string, never>;
        resources: Record<string, never>;
        tools: Record<string, never>;
        logging: Record<string, never>;
      };
    },
    sessionId?: string
  ): McpServer {
    const serverName = sessionId ? `${config.name}-${sessionId}` : config.name;

    return new McpServer(
      {
        name: serverName,
        version: config.version,
      },
      {
        capabilities: config.capabilities,
      }
    );
  }

  /**
   * Register common tools for all platforms
   */
  private static registerCommonTools(
    server: McpServer,
    logger: MCPLogger
  ): void {
    server.tool(
      WAIT_TOOL,
      WAIT_TOOL_DESCRIPTION,
      waitParamsSchema.shape,
      handleWait(logger)
    );

    server.tool(
      SCREENSHOT_TOOL,
      SCREENSHOT_DESCRIPTION,
      screenshotParamsSchema,
      handleScreenshot(logger)
    );

    server.tool(
      DRAG_TOOL,
      DRAG_DESCRIPTION,
      dragParamsSchema,
      handleDrag(logger)
    );

    server.tool(
      TYPE_TOOL,
      TYPE_DESCRIPTION,
      typeParamsSchema,
      handleType(logger)
    );

    server.tool(
      LONG_PRESS_TOOL,
      LONG_PRESS_DESCRIPTION,
      longPressParamsSchema,
      handleLongPress(logger)
    );
  }

  /**
   * Register Android-specific tools
   */
  private static registerAndroidTools(
    server: McpServer,
    logger: MCPLogger
  ): void {
    server.tool(
      START_ANDROID_BOX_TOOL,
      START_ANDROID_BOX_DESCRIPTION,
      startAndroidBoxParamsSchema,
      handleStartAndroidBox(logger)
    );

    server.tool(
      OPEN_APP_TOOL,
      OPEN_APP_DESCRIPTION,
      openAppParamsSchema,
      handleOpenApp(logger)
    );

    server.tool(
      CLOSE_APP_TOOL,
      CLOSE_APP_DESCRIPTION,
      closeAppParamsSchema,
      handleCloseApp(logger)
    );

    server.tool(
      INSTALL_APK_TOOL,
      INSTALL_APK_DESCRIPTION,
      installApkParamsSchema,
      handleInstallApk(logger)
    );

    server.tool(
      PRESS_BUTTON_TOOL,
      PRESS_BUTTON_DESCRIPTION,
      pressButtonParamsSchema,
      handlePressButton(logger)
    );

    server.tool(
      SWIPE_TOOL,
      SWIPE_DESCRIPTION,
      swipeParamsSchema,
      handleSwipe(logger)
    );

    server.tool(TAP_TOOL, TAP_DESCRIPTION, tapParamsSchema, handleTap(logger));
  }

  /**
   * Register Linux-specific tools
   */
  private static registerLinuxTools(
    server: McpServer,
    logger: MCPLogger
  ): void {
    server.tool(
      START_LINUX_BOX_TOOL,
      START_LINUX_BOX_DESCRIPTION,
      startLinuxBoxParamsSchema,
      handleStartLinuxBox(logger)
    );

    server.tool(
      CLICK_TOOL,
      CLICK_DESCRIPTION,
      clickParamsSchema,
      handleClick(logger)
    );

    server.tool(
      SCROLL_TOOL,
      SCROLL_DESCRIPTION,
      scrollParamsSchema,
      handleScroll(logger)
    );

    server.tool(
      OPEN_BROWSER_TOOL,
      OPEN_BROWSER_DESCRIPTION,
      openBrowserParamsSchema,
      handleOpenBrowser(logger)
    );

    server.tool(
      PRESS_KEY_TOOL,
      PRESS_KEY_DESCRIPTION,
      pressKeyParamsSchema,
      handlePressKey(logger)
    );
  }

  /**
   * Register Browser-specific tools
   */
  private static registerBrowserTools(
    server: McpServer,
    logger: MCPLogger
  ): void {
    server.tool(
      START_BROWSER_BOX_TOOL,
      START_BROWSER_BOX_DESCRIPTION,
      startBrowserBoxParamsSchema,
      handleStartBrowserBox(logger)
    );

    server.tool(
      CLICK_TOOL,
      CLICK_DESCRIPTION,
      clickParamsSchema,
      handleClick(logger)
    );

    server.tool(
      SCROLL_TOOL,
      SCROLL_DESCRIPTION,
      scrollParamsSchema,
      handleScroll(logger)
    );

    server.tool(
      PRESS_KEY_TOOL,
      PRESS_KEY_DESCRIPTION,
      pressKeyParamsSchema,
      handlePressKey(logger)
    );

    server.tool(
      LIST_TABS_TOOL,
      LIST_TABS_DESCRIPTION,
      listTabsParamsSchema,
      handleListTabs(logger)
    );

    server.tool(
      OPEN_TAB_TOOL,
      OPEN_TAB_DESCRIPTION,
      openTabParamsSchema,
      handleOpenTab(logger)
    );

    server.tool(
      SWITCH_TAB_TOOL,
      SWITCH_TAB_DESCRIPTION,
      switchTabParamsSchema,
      handleSwitchTab(logger)
    );

    server.tool(
      CLOSE_TAB_TOOL,
      CLOSE_TAB_DESCRIPTION,
      closeTabParamsSchema,
      handleCloseTab(logger)
    );
  }

  /**
   * Register all tools for the given platform
   */
  static registerTools(
    server: McpServer,
    platform: "android" | "linux" | "browser",
    logger: MCPLogger
  ): void {
    // Register common tools first
    this.registerCommonTools(server, logger);

    // Register platform-specific tools
    switch (platform) {
      case "android":
        this.registerAndroidTools(server, logger);
        break;
      case "linux":
        this.registerLinuxTools(server, logger);
        break;
      case "browser":
        this.registerBrowserTools(server, logger);
        break;
      default:
        // No additional tools for unknown platforms
        break;
    }
  }

  /**
   * Register all prompts
   */
  static registerPrompts(server: McpServer): void {
    const GBOX_MANUAL = "gbox-manual";
    const GBOX_MANUAL_DESCRIPTION = "Gbox Usage Guide";

    server.prompt(GBOX_MANUAL, GBOX_MANUAL_DESCRIPTION, () => {
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
  }
}
