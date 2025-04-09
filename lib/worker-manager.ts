import { cleanupWorker } from "@/actions/auth";

// Handle server shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Cleaning up worker...");
  await cleanupWorker();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received. Cleaning up worker...");
  await cleanupWorker();
  process.exit(0);
});
