import { AzureOpenAI } from "openai"

const endpoint = process.env.AZURE_OPENAI_ENDPOINT
const apiKey = process.env.AZURE_OPENAI_API_KEY
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5.2"
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-07-01-preview"

let client: AzureOpenAI | null = null

export function getOpenAIClient(): AzureOpenAI {
  if (!client) {
    if (!endpoint || !apiKey) {
      throw new Error("Azure OpenAI credentials not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.")
    }

    client = new AzureOpenAI({
      endpoint,
      apiKey,
      deployment: deploymentName,
      apiVersion,
    })
  }

  return client
}

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface StreamOptions {
  onChunk?: (chunk: string) => void
  onProgress?: (progress: { stage: string; message: string; percentage: number }) => void
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
    responseFormat?: "text" | "json"
  }
): Promise<string> {
  const client = getOpenAIClient()

  const response = await client.chat.completions.create({
    model: deploymentName,
    messages,
    max_completion_tokens: options?.maxTokens ?? 4000,
    response_format: options?.responseFormat === "json" ? { type: "json_object" } : undefined,
  })

  return response.choices[0]?.message?.content || ""
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  options?: StreamOptions & {
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  const client = getOpenAIClient()

  const stream = await client.chat.completions.create({
    model: deploymentName,
    messages,
    stream: true,
    max_completion_tokens: options?.maxTokens ?? 4000,
  })

  let fullResponse = ""
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ""
    fullResponse += content
    options?.onChunk?.(content)
  }

  return fullResponse
}

export async function chatCompletionWithJson<T>(
  messages: ChatMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
  }
): Promise<T> {
  // Add JSON instruction to the last message if not already present
  const lastMessage = messages[messages.length - 1]
  const jsonInstruction = "\n\nRespond with valid JSON only. No markdown, no code fences, just the JSON object."
  const modifiedMessages = lastMessage.content.includes("JSON")
    ? messages
    : [
        ...messages.slice(0, -1),
        { ...lastMessage, content: lastMessage.content + jsonInstruction }
      ]

  const response = await chatCompletion(modifiedMessages, {
    ...options,
    // Try without response_format as some models don't support it
  })

  if (!response || response.trim() === "") {
    throw new Error("Empty response from AI model")
  }

  // Try to extract JSON from markdown code fences if present
  let jsonString = response.trim()
  const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonString = jsonMatch[1].trim()
  }

  try {
    return JSON.parse(jsonString) as T
  } catch {
    // Show first 500 chars of response for debugging
    const preview = response.substring(0, 500)
    throw new Error(`Failed to parse JSON response: ${preview}${response.length > 500 ? "..." : ""}`)
  }
}
