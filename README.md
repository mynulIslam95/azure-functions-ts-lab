# azure-functions-ts-lab

Small **TypeScript Azure Functions** app (Node 20, programming model v4) with tests, Bicep and CI.

It exposes a cost summary API: send a list of Azure resources with monthly costs and a budget, get back the total, the cost per resource group, the most expensive resources, and an over-budget flag.

## Status

- Unit and handler tests run locally and in GitHub Actions.
- The Bicep template compiles with the Bicep CLI (`az bicep build`).
- **Not deployed to Azure yet.** No live URL.

## Endpoints

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/health` | anonymous | Service status |
| POST | `/api/costSummary` | function key | Cost summary |

Example request body:

```json
{
  "budgetEur": 500,
  "resources": [
    { "name": "vm-app-01", "resourceGroup": "rg-prod", "monthlyCostEur": 120.5 },
    { "name": "sql-main", "resourceGroup": "rg-prod", "monthlyCostEur": 300.25 },
    { "name": "storage-logs", "resourceGroup": "rg-dev", "monthlyCostEur": 22.15 }
  ]
}
```

Invalid input returns `400` with a clear error message.

## Run

```bash
npm install
npm run typecheck
npm test
npm run build
```

To run the functions locally you need [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local):

```bash
cp local.settings.json.example local.settings.json
npm start
```

## Infrastructure (Bicep)

`infra/main.bicep` creates: storage account, Log Analytics workspace, Application Insights, a Linux consumption plan, and the function app (HTTPS only, TLS 1.2, system-assigned identity).

```bash
az bicep build --file infra/main.bicep
az deployment group create -g <resource-group> -f infra/main.bicep -p appName=costlab
```

## Layout

```text
src/lib/costSummary.ts        Pure logic and input validation
src/handlers/                 HTTP handlers (testable without the Functions host)
src/functions/                Azure Functions registration
test/costSummary.test.ts      16 tests (Vitest)
infra/main.bicep              Azure resources
.github/workflows/ci.yml      Typecheck, test, build, Bicep validation
```

Mynul Islam
