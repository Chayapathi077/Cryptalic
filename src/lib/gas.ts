import type { BrowserProvider } from "ethers";

/**
 * Polygon Amoy rejects txs when priority fee is below ~25 gwei.
 * 30 gwei floor keeps us above the network minimum.
 */
const MIN_PRIORITY_FEE_WEI = BigInt(35_000_000_000);
const MIN_MAX_FEE_WEI = BigInt(100_000_000_000);
const FEE_BUFFER_NUM = BigInt(150);
const FEE_BUFFER_DEN = BigInt(100);

export type GasOverrides = {
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
};

export async function getBufferedEip1559Gas(
  provider: BrowserProvider
): Promise<GasOverrides> {
  const feeData = await provider.getFeeData();

  let maxPriorityFeePerGas =
    feeData.maxPriorityFeePerGas ?? MIN_PRIORITY_FEE_WEI;
  let maxFeePerGas = feeData.maxFeePerGas ?? MIN_MAX_FEE_WEI;

  maxPriorityFeePerGas =
    (maxPriorityFeePerGas * FEE_BUFFER_NUM) / FEE_BUFFER_DEN;
  maxFeePerGas = (maxFeePerGas * FEE_BUFFER_NUM) / FEE_BUFFER_DEN;

  if (maxPriorityFeePerGas < MIN_PRIORITY_FEE_WEI) {
    maxPriorityFeePerGas = MIN_PRIORITY_FEE_WEI;
  }
  if (maxFeePerGas < MIN_MAX_FEE_WEI) {
    maxFeePerGas = MIN_MAX_FEE_WEI;
  }
  if (maxFeePerGas < maxPriorityFeePerGas) {
    maxFeePerGas = maxPriorityFeePerGas * BigInt(2);
  }

  return { maxPriorityFeePerGas, maxFeePerGas };
}

export function isGasPriceError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("underpriced") ||
    lower.includes("gas tip cap") ||
    lower.includes("gas price below minimum") ||
    lower.includes("transaction gas price")
  );
}

export function gasPriceErrorHelp(): string {
  return "Amoy needs a higher gas tip (~30 gwei). Refresh the page and try again, or in MetaMask set fees to Aggressive before confirming.";
}
