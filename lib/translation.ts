// lib/translation.ts
import { createAdminClient } from '@/lib/supabase-admin'

export interface TranslationLlmConfig {
  provider: 'gemini' | 'openai_compatible'
  primary_model: string
  fallback_model: string
  temperature: number
  enabled: boolean
}

export interface RecentContextMessage {
  sender_type: 'visitor' | 'owner'
  text: string
}

export interface TranslateMessageInput {
  text: string
  sourceLang: string
  targetLang: string
  autoTranslateEnabled: boolean
  canTranslateByQuota: boolean
  recentContext?: RecentContextMessage[]
}

export type TranslationFallbackReason =
  | null
  | 'disabled'
  | 'quota_exceeded'
  | 'same_language'
  | 'non_translatable'
  | 'provider_error'

export interface TranslateMessageResult {
  translatedText: string | null
  translatedLang: string | null
  wasTranslated: boolean
  translationFallbackReason: TranslationFallbackReason
}

const DEFAULT_LLM_CONFIG: TranslationLlmConfig = {
  provider: 'gemini',
  primary_model:
    process.env.GEMINI_TRANSLATION_MODEL || 'gemini-2.5-flash-lite',
  fallback_model: process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash',
  temperature: 0.1,
  enabled: true,
}

let cachedConfig: { value: TranslationLlmConfig; expiresAt: number } | null =
  null

export async function getTranslationLlmConfig(): Promise<TranslationLlmConfig> {
  const now = Date.now()
  if (cachedConfig && cachedConfig.expiresAt > now) {
    return cachedConfig.value
  }

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'translation_llm_config')
      .maybeSingle()

    if (data?.value && typeof data.value === 'object') {
      const raw = data.value as Partial<TranslationLlmConfig>
      const merged: TranslationLlmConfig = {
        provider:
          raw.provider === 'openai_compatible' ? 'openai_compatible' : 'gemini',
        primary_model:
          typeof raw.primary_model === 'string' && raw.primary_model.trim()
            ? raw.primary_model.trim()
            : DEFAULT_LLM_CONFIG.primary_model,
        fallback_model:
          typeof raw.fallback_model === 'string' && raw.fallback_model.trim()
            ? raw.fallback_model.trim()
            : DEFAULT_LLM_CONFIG.fallback_model,
        temperature:
          typeof raw.temperature === 'number'
            ? raw.temperature
            : DEFAULT_LLM_CONFIG.temperature,
        enabled:
          typeof raw.enabled === 'boolean'
            ? raw.enabled
            : DEFAULT_LLM_CONFIG.enabled,
      }

      cachedConfig = { value: merged, expiresAt: now + 60_000 }
      return merged
    }
  } catch {
    // Si falla la lectura de system_settings, usamos valor por defecto seguro
  }

  cachedConfig = { value: DEFAULT_LLM_CONFIG, expiresAt: now + 30_000 }
  return DEFAULT_LLM_CONFIG
}

/**
 * Omite llamadas al LLM cuando el mensaje contiene únicamente URLs,
 * @menciones, números/puntuación o emojis/símbolos sin letras.
 */
export function isNonTranslatableMessage(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true

  const withoutUrlsAndMentions = trimmed
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/@[\w.-]+/g, '')
    .replace(/[\d\s.,;:!?()[\]{}\-+/\\@#$%^&*_=|~`"'<>]+/g, '')
    .trim()

  if (withoutUrlsAndMentions.length === 0) {
    return true
  }

  const hasLetters = /\p{L}/u.test(withoutUrlsAndMentions)
  return !hasLetters
}

async function callGeminiModel(params: {
  apiKey: string
  model: string
  systemInstruction: string
  prompt: string
  temperature: number
}): Promise<string | null> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    params.model
  )}:generateContent?key=${encodeURIComponent(params.apiKey)}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: params.systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: params.prompt }],
        },
      ],
      generationConfig: {
        temperature: params.temperature,
        // Desactiva razonamiento oculto para menor latencia y menor coste en tokens
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  })

  if (!response.ok) {
    return null
  }

  const json = await response.json()
  const parts = json?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return null

  const textOut = parts
    .map((p: { text?: string }) => (typeof p?.text === 'string' ? p.text : ''))
    .join('')
    .trim()

  return textOut || null
}

export async function translateChatMessage(
  input: TranslateMessageInput
): Promise<TranslateMessageResult> {
  const normalizedSource = input.sourceLang.trim().toLowerCase()
  const normalizedTarget = input.targetLang.trim().toLowerCase()

  if (!input.autoTranslateEnabled) {
    return {
      translatedText: null,
      translatedLang: null,
      wasTranslated: false,
      translationFallbackReason: 'disabled',
    }
  }

  if (!input.canTranslateByQuota) {
    return {
      translatedText: null,
      translatedLang: null,
      wasTranslated: false,
      translationFallbackReason: 'quota_exceeded',
    }
  }

  if (normalizedSource === normalizedTarget) {
    return {
      translatedText: null,
      translatedLang: normalizedTarget,
      wasTranslated: false,
      translationFallbackReason: 'same_language',
    }
  }

  if (isNonTranslatableMessage(input.text)) {
    return {
      translatedText: null,
      translatedLang: normalizedTarget,
      wasTranslated: false,
      translationFallbackReason: 'non_translatable',
    }
  }

  const llmConfig = await getTranslationLlmConfig()
  const apiKey = process.env.GEMINI_API_KEY

  if (!llmConfig.enabled || !apiKey) {
    return {
      translatedText: null,
      translatedLang: normalizedTarget,
      wasTranslated: false,
      translationFallbackReason: 'provider_error',
    }
  }

  const systemInstruction = `Translate chat messages into language code "${normalizedTarget}". Keep original tone, slang, and emojis. Output ONLY the translated text with no extra commentary.`

  const contextLines =
    input.recentContext && input.recentContext.length > 0
      ? `\nRecent context (do not translate this context, only use for tone/meaning):\n${input.recentContext
          .slice(-2)
          .map((m) => `[${m.sender_type}]: ${m.text}`)
          .join('\n')}\n`
      : ''

  const prompt = `${contextLines}\nMessage to translate:\n${input.text}`

  const modelsToTry = [llmConfig.primary_model, llmConfig.fallback_model].filter(
    (m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx
  )

  for (const model of modelsToTry) {
    try {
      const translated = await callGeminiModel({
        apiKey,
        model,
        systemInstruction,
        prompt,
        temperature: llmConfig.temperature,
      })

      if (translated) {
        return {
          translatedText: translated,
          translatedLang: normalizedTarget,
          wasTranslated: true,
          translationFallbackReason: null,
        }
      }
    } catch {
      // Intenta el siguiente modelo de respaldo
    }
  }

  return {
    translatedText: null,
    translatedLang: normalizedTarget,
    wasTranslated: false,
    translationFallbackReason: 'provider_error',
  }
}