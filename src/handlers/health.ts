import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function healthHandler(
  _request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  return {
    status: 200,
    jsonBody: { status: "ok", service: "azure-functions-ts-lab", time: new Date().toISOString() },
  };
}
