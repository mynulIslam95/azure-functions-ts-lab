import { app } from "@azure/functions";
import { healthHandler } from "../handlers/health";

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: healthHandler,
});
