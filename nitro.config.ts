import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  preset: "vercel",
  // Vercel needs handlers to be at .output/functions
  // TanStack Start routes automatically get picked up
});
