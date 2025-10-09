# GBOX MCP SERVER

[![npm version](https://img.shields.io/npm/v/@gbox.ai/mcp-server.svg)](https://www.npmjs.com/package/@gbox.ai/mcp-server)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Description

GBOX MCP Server enables AI Agents (Cursor/Claude Code/...) to operate Android devices, Linux environments, and browser sessions. The devices can be Cloud VM/Cloud Physical provided by gbox.ai or your local devices. It can be used for Android App Testing, web automation, and general-purpose computing tasks.

## Supported Platforms

- **Android** - Control Android devices (cloud or local)
- **Linux** - Control Linux desktop environments
- **Browser** - Control browser sessions with tab management

## Usage

### Android Mode

For Android device automation. See [GBOX Android MCP](https://docs.gbox.ai/docs-mcp/android-mcp-server) for details.

```json
"gbox-android": {
  "command": "npx",
  "args": [
    "-y",
    "@gbox.ai/mcp-server@latest",
    "--android"
  ],
  "env": {
    "GBOX_API_KEY": "gbox_xxxx",
    "GBOX_BASE_URL": "https://gbox.ai/api/v1"
  }
}
```

### Linux Mode

For Linux desktop automation with browser support.

```json
"gbox-linux": {
  "command": "npx",
  "args": [
    "-y",
    "@gbox.ai/mcp-server@latest",
    "--linux"
  ],
  "env": {
    "GBOX_API_KEY": "gbox_xxxx",
    "GBOX_BASE_URL": "https://gbox.ai/api/v1"
  }
}
```

### Browser Mode

For web automation with pre-opened browser and advanced tab management.

```json
"gbox-browser": {
  "command": "npx",
  "args": [
    "-y",
    "@gbox.ai/mcp-server@latest",
    "--browser"
  ],
  "env": {
    "GBOX_API_KEY": "gbox_xxxx",
    "GBOX_BASE_URL": "https://gbox.ai/api/v1"
  }
}
```

**Browser Mode Features:**
- Browser opens maximized without controls
- Tab management: `list_tabs`, `open_tab`, `switch_tab`, `close_tab`
- Standard interaction tools: `click`, `scroll`, `press_key`, `type`, `screenshot`

## Configuration

**Note:** You can omit the `env` section if you have successfully run `gbox login` in CLI.

For instructions on logging in and configuring your profile, refer to the [Gbox CLI Documentation](https://github.com/babelcloud/gbox).

If you are already logged in, obtain your `GBOX_API_KEY` from the Personal tab at [gbox.ai/dashboard](https://gbox.ai/dashboard).

To use your local Android devices, check [Register Your Own Device](https://docs.gbox.ai/cli/register-local-device).

## Resources

- [Official Documentation](https://docs.gbox.ai)
- [GBOX Android MCP](https://docs.gbox.ai/docs-mcp/android-mcp-server)
- [GBOX CLI](https://github.com/babelcloud/gbox)
- [Dashboard](https://gbox.ai/dashboard)
