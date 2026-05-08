import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VitrineClient } from "../client.js";

export function registerFeedbackTools(server: McpServer, client: VitrineClient) {
  server.registerTool(
    "vitrine_feedback",
    {
      title: "Submit Feedback",
      description: "Submit a bug report or feature request. Creates a GitHub issue automatically.",
      inputSchema: z.object({
        type: z.enum(["bug", "feature", "other"]).describe("Feedback type"),
        message: z.string().describe("Description of the bug or feature request"),
        page: z.string().optional().describe("Which page/area this relates to"),
      }),
    },
    async ({ type, message, page }) => {
      const res = await client.submitFeedback(type, message, page);
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: "Feedback submitted. A GitHub issue has been created." }] };
    },
  );
}
