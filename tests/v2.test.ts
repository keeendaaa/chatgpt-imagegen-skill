import assert from "node:assert/strict"
import { mkdtemp, readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import { tmpdir } from "node:os"
import plugin from "../v2"

test("V2 registration, OAuth, session path, cancellation signal and non-overwrite output", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "imagegen-test-"))
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64")
  const permissions: any[] = []
  let tool: any
  let auth: any = { type: "oauth", access: "test-token", metadata: { accountId: "test-account" } }
  const controller = new AbortController()
  await plugin.setup({
    location: { directory: "/wrong-location" },
    tool: { transform: async (register: any) => register({ add: (value: any) => { tool = value } }) },
    session: { get: async () => ({ data: { directory } }) },
    permission: { assert: async (value: any) => { permissions.push(value) } },
    integration: { connection: { active: async () => ({ type: "credential" }), resolve: async () => auth } },
  })
  assert.equal(tool.name, "gpt_imagegen")
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async (url, init) => {
    calls++
    assert.equal(url, "https://chatgpt.com/backend-api/codex/images/generations")
    assert.equal(init?.signal, controller.signal)
    assert.equal((init?.headers as any).Authorization, "Bearer test-token")
    assert.equal((init?.headers as any)["ChatGPT-Account-Id"], "test-account")
    return new Response(JSON.stringify({ data: [{ b64_json: png.toString("base64") }] }))
  }
  const context = { sessionID: "test-session", messageID: "test-message", id: "test-call", signal: controller.signal, progress: async () => {} }
  const input = { prompt: "Test", out: "test.png", size: "1254x1254" }
  try {
    await tool.execute(input, context)
    await tool.execute(input, context)
    assert.deepEqual(await readFile(path.join(directory, "test.png")), png)
    assert.deepEqual(await readFile(path.join(directory, "test-v2.png")), png)
    assert.equal(permissions[0].resources[0], path.join(directory, "test.png"))
    await assert.rejects(tool.execute({ ...input, size: "invalid" }, context), /supported size/)
    await assert.rejects(tool.execute({ ...input, images: Array(6).fill("x") }, context), /five/)
    auth = { type: "key", key: "must-not-be-used" }
    await assert.rejects(tool.execute(input, context), /OAuth is required/)
    assert.equal(calls, 2)
  } finally {
    globalThis.fetch = originalFetch
  }
})
