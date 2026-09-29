import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseResources, summarizeCosts, ValidationError } from "../lib/costSummary";

export async function costSummaryHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { status: 400, jsonBody: { error: "Request body must be valid JSON" } };
  }

  try {
    const { budgetEur, resources } = (body ?? {}) as Record<string, unknown>;
    if (typeof budgetEur !== "number") {
      throw new ValidationError("budgetEur must be a number");
    }
    const summary = summarizeCosts(parseResources(resources), budgetEur);
    context.log(
      `cost summary: total=${summary.totalEur} budget=${summary.budgetEur} over=${summary.overBudget}`,
    );
    return { status: 200, jsonBody: summary };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { status: 400, jsonBody: { error: error.message } };
    }
    context.error("unexpected error", error);
    return { status: 500, jsonBody: { error: "Internal server error" } };
  }
}
