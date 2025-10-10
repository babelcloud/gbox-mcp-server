import GboxSDK, { ClientOptions } from "gbox-sdk";

/**
 * Create a new GboxSDK instance with user configuration
 */
export function createGboxSDK(clientOptions?: ClientOptions): GboxSDK {
  return new GboxSDK(clientOptions);
}

/**
 * Create a new GboxSDK instance with default configuration
 */
export function createDefaultGboxSDK(): GboxSDK {
  return new GboxSDK();
}
