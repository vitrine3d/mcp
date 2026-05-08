/** Vitrine API client — thin fetch wrapper over the REST API. */

const DEFAULT_BASE_URL = "https://api.vitrine3d.com";

export class VitrineClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(opts: { apiKey?: string; jwt?: string; baseUrl?: string }) {
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.headers = { "Content-Type": "application/json" };

    if (opts.apiKey) {
      this.headers["Authorization"] = `Bearer ${opts.apiKey}`;
    } else if (opts.jwt) {
      this.headers["Authorization"] = `Bearer ${opts.jwt}`;
    }
  }

  async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<{ ok: boolean; status: number; data: any }> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  }

  async upload(
    path: string,
    file: Buffer | Uint8Array,
    filename: string,
    extraFields?: Record<string, string>,
  ): Promise<{ ok: boolean; status: number; data: any }> {
    const form = new FormData();
    const copy = new Uint8Array(file).slice();
    form.append("file", new File([copy.buffer as ArrayBuffer], filename, { type: "model/gltf-binary" }));
    if (extraFields) {
      for (const [k, v] of Object.entries(extraFields)) {
        form.append(k, v);
      }
    }

    // Don't set Content-Type — let fetch set multipart boundary
    const headers: Record<string, string> = {};
    if (this.headers["Authorization"]) {
      headers["Authorization"] = this.headers["Authorization"];
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: form,
    });

    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  }

  /** Update auth header (e.g. after login). */
  setAuth(apiKeyOrJwt: string): void {
    this.headers["Authorization"] = `Bearer ${apiKeyOrJwt}`;
  }

  // ── Convenience methods ──

  listModels() {
    return this.request("GET", "/v1/models");
  }

  getModel(id: string) {
    return this.request("GET", `/v1/models/${id}`);
  }

  deleteModel(id: string) {
    return this.request("DELETE", `/v1/models/${id}`);
  }

  uploadModel(file: Buffer | Uint8Array, filename: string, name?: string) {
    return this.upload("/v1/models", file, filename, name ? { name } : undefined);
  }

  getConfig(modelId: string) {
    return this.request("GET", `/v1/models/${modelId}/config`);
  }

  patchConfig(modelId: string, patch: Record<string, unknown>) {
    return this.request("PATCH", `/v1/models/${modelId}/config`, patch);
  }

  updateShowcase(id: string, update: Record<string, unknown>) {
    return this.request("PATCH", `/v1/showcases/${id}`, update);
  }

  getEmbed(showcaseId: string) {
    return this.request("GET", `/v1/showcases/${showcaseId}/embed`);
  }

  listLooks() {
    return this.request("GET", "/v1/looks");
  }

  createLook(name: string, config: Record<string, unknown>) {
    return this.request("POST", "/v1/looks", { name, config });
  }

  updateLook(id: string, update: Record<string, unknown>) {
    return this.request("PATCH", `/v1/looks/${id}`, update);
  }

  deleteLook(id: string) {
    return this.request("DELETE", `/v1/looks/${id}`);
  }

  triggerThumbnail(modelId: string) {
    return this.request("POST", `/v1/models/${modelId}/thumbnail`);
  }

  submitFeedback(type: string, message: string, page?: string, meta?: Record<string, unknown>) {
    return this.request("POST", "/v1/feedback", { type, message, page, meta });
  }

  getAccount() {
    return this.request("GET", "/v1/account");
  }

  listHdris() {
    return this.request("GET", "/v1/hdris");
  }

  getConfigSchema() {
    return this.request("GET", "/v1/config-schema");
  }
}
