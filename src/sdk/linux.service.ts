import GboxSDK, { LinuxBoxOperator } from "gbox-sdk";

// Initialize Gbox SDK
const gboxSDK = new GboxSDK();

export async function attachBox(boxId: string): Promise<LinuxBoxOperator> {
  try {
    const box = (await gboxSDK.get(boxId)) as LinuxBoxOperator;
    return box;
  } catch (err) {
    throw new Error(
      `Failed to attach to box ${boxId}: ${(err as Error).message}`
    );
  }
}

export { gboxSDK };
