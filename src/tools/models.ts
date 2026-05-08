import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VitrineClient } from "../client.js";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

export function registerModelTools(server: McpServer, client: VitrineClient, authState: { isAnonymous: boolean }) {
  server.registerTool(
    "vitrine_list_models",
    {
      title: "List Models",
      description: "List all your Vitrine 3D models with IDs, names, and publish status.",
      inputSchema: z.object({}),
    },
    async () => {
      const res = await client.listModels();
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.registerTool(
    "vitrine_upload_model",
    {
      title: "Upload Model",
      description: "Upload a GLB/glTF file to Vitrine. Provide the absolute file path on disk.",
      inputSchema: z.object({
        file_path: z.string().describe("Absolute path to the GLB file"),
        name: z.string().optional().describe("Display name for the model"),
      }),
    },
    async ({ file_path, name }) => {
      let buf: Buffer;
      try {
        buf = await readFile(file_path);
      } catch (e: any) {
        return { content: [{ type: "text", text: `Could not read file: ${e.message}` }], isError: true };
      }
      const filename = basename(file_path);
      let res;
      try {
        res = await client.uploadModel(buf, filename, name);
      } catch (e: any) {
        return { content: [{ type: "text", text: `Upload failed: ${e.message}` }], isError: true };
      }
      if (!res.ok) return { content: [{ type: "text", text: `Upload failed: ${res.data?.message ?? res.status}` }], isError: true };
      let msg = `Uploaded successfully.\n${JSON.stringify(res.data, null, 2)}`;
      if (authState.isAnonymous) {
        msg += `\n\nNote: You're using Vitrine anonymously. This model will expire in 48 hours. Use vitrine_login to create a free account and keep it permanently.`;
      }
      return { content: [{ type: "text", text: msg }] };
    },
  );

  server.registerTool(
    "vitrine_model_info",
    {
      title: "Model Info",
      description: "Get detailed info about a model including config, thumbnail, and model URL.",
      inputSchema: z.object({
        model_id: z.string().describe("Model ID"),
      }),
    },
    async ({ model_id }) => {
      const res = await client.getModel(model_id);
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.registerTool(
    "vitrine_delete_model",
    {
      title: "Delete Model",
      description: "Delete a model and all its associated storage files.",
      inputSchema: z.object({
        model_id: z.string().describe("Model ID to delete"),
      }),
      annotations: { destructiveHint: true },
    },
    async ({ model_id }) => {
      const res = await client.deleteModel(model_id);
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: `Model ${model_id} deleted.` }] };
    },
  );
}
