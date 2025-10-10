import GboxSDK, { LinuxBoxOperator } from "gbox-sdk";

export async function attachBox(
  boxId: string,
  gboxSDK: GboxSDK
): Promise<LinuxBoxOperator> {
  try {
    const box = (await gboxSDK.get(boxId)) as LinuxBoxOperator;
    return box;
  } catch (err) {
    throw new Error(
      `Failed to attach to box ${boxId}: ${(err as Error).message}`
    );
  }
}
