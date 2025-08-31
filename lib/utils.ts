import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Optional artificial delay for showcasing skeleton/loading states in the UI during testing.
// Set NEXT_PUBLIC_FAKE_LOADING_DELAY_MS (e.g. 1500) to enable.
export async function fakeDelay(extraMs: number = 0) {
  const base = Number(process.env.NEXT_PUBLIC_FAKE_LOADING_DELAY_MS || 0)
  const total = base + extraMs
  if (total > 0) {
    await new Promise(res => setTimeout(res, total))
  }
}
