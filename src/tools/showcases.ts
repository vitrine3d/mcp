import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VitrineClient } from "../client.js";

export function registerShowcaseTools(server: McpServer, client: VitrineClient) {
  server.registerTool(
    "vitrine_publish",
    {
      title: "Publish / Unpublish",
      description: "Publish or unpublish a model. Published models are embeddable.",
      inputSchema: z.object({
        model_id: z.string().describe("Model ID (same as showcase ID)"),
        published: z.boolean().describe("true to publish, false to unpublish"),
      }),
    },
    async ({ model_id, published }) => {
      const res = await client.updateShowcase(model_id, { published });
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: `Model ${published ? "published" : "unpublished"}.\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );

  server.registerTool(
    "vitrine_get_embed",
    {
      title: "Get Embed Code",
      description: "Get ready-to-paste HTML embed code for a published model.",
      inputSchema: z.object({
        model_id: z.string().describe("Model ID (must be published)"),
      }),
    },
    async ({ model_id }) => {
      const res = await client.getEmbed(model_id);
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: res.data.html }] };
    },
  );
}
