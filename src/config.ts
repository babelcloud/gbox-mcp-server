import "dotenv/config";
import { Platform, PLATFORMS } from "./types/platform.js";

// Parse command line arguments for platform selection
const args = process.argv.slice(2);
const platformArg = args.find(
  arg => arg === "--android" || arg === "--linux" || arg === "--browser"
);
const platform = platformArg?.replace("--", "") || "android"; // default to android

export const config = {
  mode: process.env.MODE?.toLowerCase() || "stdio",
  platform: platform as Platform,
  allPlatforms: PLATFORMS,
};
