import { describe, expect, it } from "vitest";
import { HttpRequest, InvocationContext } from "@azure/functions";
import { parseResources, summarizeCosts, ValidationError } from "../src/lib/costSummary";
import { costSummaryHandler } from "../src/handlers/costSummary";
import { healthHandler } from "../src/handlers/health";

const sample = [
  { name: "vm-app-01", resourceGroup: "rg-prod", monthlyCostEur: 120.5 },
  { name: "sql-main", resourceGroup: "rg-prod", monthlyCostEur: 300.25 },
  { name: "func-tools", resourceGroup: "rg-dev", monthlyCostEur: 4.1 },
  { name: "storage-logs", resourceGroup: "rg-dev", monthlyCostEur: 22.15 },
];

function post(body: string): HttpRequest {
  return new HttpRequest({
    method: "POST",
    url: "http://localhost:7071/api/costSummary",
    headers: { "content-type": "application/json" },
    body: { string: body },
  });
}

describe("summarizeCosts", () => {
  it("sums the total and groups by resource group (largest first)", () => {
    const result = summarizeCosts(sample, 1000);
    expect(result.totalEur).toBe(447);
    expect(Object.keys(result.byResourceGroup)).toEqual(["rg-prod", "rg-dev"]);
    expect(result.byResourceGroup["rg-prod"]).toBe(420.75);
    expect(result.byResourceGroup["rg-dev"]).toBe(26.25);
  });

  it("returns the most expensive resources first", () => {
    const result = summarizeCosts(sample, 1000, 2);
    expect(result.topResources.map((r) => r.name)).toEqual(["sql-main", "vm-app-01"]);
  });

  it("flags when the total is over budget", () => {
    expect(summarizeCosts(sample, 400).overBudget).toBe(true);
    expect(summarizeCosts(sample, 447).overBudget).toBe(false);
  });

  it("rejects a negative budget", () => {
    expect(() => summarizeCosts(sample, -1)).toThrow(ValidationError);
  });
});

describe("parseResources", () => {
  it("accepts valid input and trims names", () => {
    const parsed = parseResources([{ name: " vm ", resourceGroup: "rg", monthlyCostEur: 1 }]);
    expect(parsed[0].name).toBe("vm");
  });

  it.each([
    ["empty array", []],
    ["not an array", "nope"],
    ["missing name", [{ resourceGroup: "rg", monthlyCostEur: 1 }]],
    ["blank resource group", [{ name: "a", resourceGroup: " ", monthlyCostEur: 1 }]],
    ["negative cost", [{ name: "a", resourceGroup: "rg", monthlyCostEur: -5 }]],
    ["cost as string", [{ name: "a", resourceGroup: "rg", monthlyCostEur: "5" }]],
  ])("rejects %s", (_label, input) => {
    expect(() => parseResources(input)).toThrow(ValidationError);
  });
});

describe("costSummaryHandler", () => {
  const context = new InvocationContext();

  it("returns 200 with a summary for valid input", async () => {
    const response = await costSummaryHandler(
      post(JSON.stringify({ budgetEur: 500, resources: sample })),
      context,
    );
    expect(response.status).toBe(200);
    expect((response.jsonBody as { totalEur: number }).totalEur).toBe(447);
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await costSummaryHandler(post("{not json"), context);
    expect(response.status).toBe(400);
  });

  it("returns 400 when budgetEur is missing", async () => {
    const response = await costSummaryHandler(
      post(JSON.stringify({ resources: sample })),
      context,
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 for an invalid resource", async () => {
    const response = await costSummaryHandler(
      post(JSON.stringify({ budgetEur: 10, resources: [{ name: "x" }] })),
      context,
    );
    expect(response.status).toBe(400);
  });
});

describe("healthHandler", () => {
  it("returns status ok", async () => {
    const response = await healthHandler(
      new HttpRequest({ method: "GET", url: "http://localhost:7071/api/health" }),
      new InvocationContext(),
    );
    expect(response.status).toBe(200);
    expect((response.jsonBody as { status: string }).status).toBe("ok");
  });
});
