#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { VitrineClient } from "./client.js";
import { resolveCredentials } from "./auth.js";
import { registerModelTools } from "./tools/models.js";
import { registerConfigTools } from "./tools/config.js";
import { registerShowcaseTools } from "./tools/showcases.js";
import { registerLookTools } from "./tools/looks.js";
import { registerFeedbackTools } from "./tools/feedback.js";
import { registerAccountTools } from "./tools/account.js";
import { registerLoginTools } from "./tools/login.js";
import { registerResources } from "./resources.js";

const server = new McpServer(
  {
    name: "vitrine",
    version: "0.2.0",
  },
  {
    instructions:
      "Vitrine 3D viewer management. Upload GLB models, configure scenes " +
      "(lighting, camera, background, effects), publish embeds, and manage Looks. " +
      "Use vitrine_config_schema to discover all available scene config fields. " +
      "If the user wants to keep their models permanently, use vitrine_login to connect their account.",
  },
);

const creds = await resolveCredentials();
const client = new VitrineClient(creds);

const authState = {
  isAnonymous: creds.isAnonymous,
  anonUserId: creds.anonUserId,
};

// Register all tools
registerModelTools(server, client, authState);
registerConfigTools(server, client);
registerShowcaseTools(server, client);
registerLookTools(server, client);
registerFeedbackTools(server, client);
registerAccountTools(server, client);
registerLoginTools(server, client, authState);

// Register resources
registerResources(server, client);

// Start
const transport = new StdioServerTransport();
await server.connect(transport);
