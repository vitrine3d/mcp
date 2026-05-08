import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VitrineClient } from "../client.js";

export function registerAccountTools(server: McpServer, client: VitrineClient) {
  server.registerTool(
    "vitrine_account_info",
    {
      title: "Account Info",
      description: "Get current account info: plan tier, usage counts, and limits.",
      inputSchema: z.object({}),
    },
    async () => {
      const res = await client.getAccount();
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    },
  );
}
