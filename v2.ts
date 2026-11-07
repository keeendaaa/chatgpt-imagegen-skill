// Local V2 entrypoint for opencode-gpt-imagegen 0.1.14 (upstream MIT license).
// Keep upstream image handling; resolve OAuth through OpenCode rather than auth.json.
import * as path from "node:path"
import { callViaCodexImages } from "./src/codex"
import { readReferenceImages } from "./src/input-image"
import { saveGeneratedImage } from "./src/output-image"
import { IMAGE_SIZES } from "./src/size"
import type { GenerateArgs } from "./src/types"

export default {
  id: "local.gpt-imagegen.v2",
  async setup(ctx: any) {
    await ctx.tool.transform((editor: any) => {
      editor.add({
        name: "gpt_imagegen",
        description: "Generate or edit a PNG using the user's ChatGPT subscription (consumes Codex quota, no API key). Supports up to five reference images. Returns the actual saved path and pixel dimensions. Never overwrites an existing output: adds -v2, -v3, etc. Pick a supported size matching the requested aspect ratio. Use background transparent for cutouts. Do not use for SVG/vector/code-native assets.",
        input: {
          type: "object",
          properties: {
            prompt: { type: "string", minLength: 1 },
            out: { type: "string", minLength: 1, description: "PNG output path, relative to the session directory or absolute." },
            size: { type: "string", enum: Object.keys(IMAGE_SIZES) },
            images: { type: "array", maxItems: 5, items: { type: "string" } },
            background: { type: "string", enum: ["opaque", "transparent"] },
          },
          required: ["prompt", "out", "size"],
          additionalProperties: false,
        },
        async execute(input: GenerateArgs, context: any) {
          if (!input.prompt?.trim() || !input.out?.trim() || !Object.hasOwn(IMAGE_SIZES, input.size)) {
            throw new Error("A nonempty prompt, output path, and supported size are required.")
          }
          if (input.images && (!Array.isArray(input.images) || input.images.length > 5)) {
            throw new Error("At most five reference images are supported.")
          }
          const sessionResult = await ctx.session.get({ sessionID: context.sessionID })
          const session = sessionResult.data ?? sessionResult
          const directory = session.directory ?? ctx.location.directory
          const assert = (action: string, resource: string) => ctx.permission.assert({
            sessionID: context.sessionID,
            agent: context.agent,
            source: { type: "tool", messageID: context.messageID, id: context.id },
            action,
            resources: [resource],
            save: [resource],
          })
          for (const image of input.images ?? []) await assert("read", path.resolve(directory, image))
          await assert("edit", path.resolve(directory, input.out))
          const connectionResult = await ctx.integration.connection.active("openai")
          const connection = connectionResult?.data ?? connectionResult
          if (!connection) throw new Error("Connect OpenAI with ChatGPT in /connect first.")
          const credentialResult = await ctx.integration.connection.resolve(connection)
          const credential = credentialResult?.data ?? credentialResult
          if (credential?.type !== "oauth" || !credential.access) {
            throw new Error("ChatGPT OAuth is required; API-key authentication is not supported.")
          }
          const accountId = credential.metadata?.accountId ?? credential.metadata?.account_id
          const images = await readReferenceImages(input.images, directory)
          await context.progress({ status: "Generating image with ChatGPT subscription" })
          const base64 = await callViaCodexImages({ type: "oauth", access: credential.access, accountId }, input, images, context.signal)
          const result = await saveGeneratedImage(input.out, directory, base64)
          return { content: result.message }
        },
      })
    })
  },
}
