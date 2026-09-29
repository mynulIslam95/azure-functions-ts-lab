import { app } from "@azure/functions";
import { costSummaryHandler } from "../handlers/costSummary";

app.http("costSummary", {
  methods: ["POST"],
  authLevel: "function",
  handler: costSummaryHandler,
});
