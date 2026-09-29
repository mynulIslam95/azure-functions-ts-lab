export interface ResourceCost {
  name: string;
  resourceGroup: string;
  monthlyCostEur: number;
}

export interface CostSummary {
  totalEur: number;
  budgetEur: number;
  overBudget: boolean;
  byResourceGroup: Record<string, number>;
  topResources: ResourceCost[];
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

export function parseResources(input: unknown): ResourceCost[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new ValidationError("resources must be a non-empty array");
  }

  return input.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new ValidationError(`resources[${index}] must be an object`);
    }
    const { name, resourceGroup, monthlyCostEur } = item as Record<string, unknown>;

    if (typeof name !== "string" || name.trim() === "") {
      throw new ValidationError(`resources[${index}].name must be a non-empty string`);
    }
    if (typeof resourceGroup !== "string" || resourceGroup.trim() === "") {
      throw new ValidationError(`resources[${index}].resourceGroup must be a non-empty string`);
    }
    if (typeof monthlyCostEur !== "number" || !Number.isFinite(monthlyCostEur) || monthlyCostEur < 0) {
      throw new ValidationError(`resources[${index}].monthlyCostEur must be a number >= 0`);
    }

    return { name: name.trim(), resourceGroup: resourceGroup.trim(), monthlyCostEur };
  });
}

export function summarizeCosts(
  resources: ResourceCost[],
  budgetEur: number,
  topN = 3,
): CostSummary {
  if (!Number.isFinite(budgetEur) || budgetEur < 0) {
    throw new ValidationError("budgetEur must be a number >= 0");
  }

  const byGroup = new Map<string, number>();
  let total = 0;

  for (const resource of resources) {
    total += resource.monthlyCostEur;
    byGroup.set(
      resource.resourceGroup,
      (byGroup.get(resource.resourceGroup) ?? 0) + resource.monthlyCostEur,
    );
  }

  const byResourceGroup: Record<string, number> = {};
  for (const [group, cost] of [...byGroup.entries()].sort((a, b) => b[1] - a[1])) {
    byResourceGroup[group] = round2(cost);
  }

  const topResources = [...resources]
    .sort((a, b) => b.monthlyCostEur - a.monthlyCostEur)
    .slice(0, topN);

  return {
    totalEur: round2(total),
    budgetEur,
    overBudget: round2(total) > budgetEur,
    byResourceGroup,
    topResources,
  };
}
