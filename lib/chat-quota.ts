// lib/chat-quota.ts
import { createAdminClient } from '@/lib/supabase-admin'

export type QuotaAlertLevel =
  | null
  | 'warning_90'
  | 'critical_95'
  | 'exceeded_100'

export interface ChatQuotaState {
  monthlyLimit: number
  extraCredits: number
  effectiveLimit: number
  usedMonth: number
  usagePercent: number
  canTranslate: boolean
  alertLevel: QuotaAlertLevel
  cycleResetAt: string
}

const DEFAULT_MONTHLY_LIMIT = 500

// Rate-limit ligero en memoria por instancia serverless (complementado con tope diario en BD)
const minuteRateMap = new Map<string, number[]>()

export function checkMinuteRateLimit(
  key: string,
  maxPerMinute = 12
): { allowed: boolean } {
  const now = Date.now()
  const windowStart = now - 60_000
  const recent = (minuteRateMap.get(key) ?? []).filter((ts) => ts > windowStart)

  if (recent.length >= maxPerMinute) {
    minuteRateMap.set(key, recent)
    return { allowed: false }
  }

  recent.push(now)
  minuteRateMap.set(key, recent)
  return { allowed: true }
}

export function evaluateQuotaState(params: {
  usedMonth: number
  monthlyLimit: number
  extraCredits?: number
  cycleResetAt?: string
}): ChatQuotaState {
  const monthlyLimit =
    typeof params.monthlyLimit === 'number' && params.monthlyLimit > 0
      ? params.monthlyLimit
      : DEFAULT_MONTHLY_LIMIT

  const extraCredits =
    typeof params.extraCredits === 'number' && params.extraCredits >= 0
      ? params.extraCredits
      : 0

  const effectiveLimit = monthlyLimit + extraCredits
  const usedMonth = Math.max(0, Math.floor(params.usedMonth || 0))
  const usagePercent =
    effectiveLimit > 0
      ? Number(((usedMonth / effectiveLimit) * 100).toFixed(1))
      : 100

  let alertLevel: QuotaAlertLevel = null
  let canTranslate = true

  if (usedMonth >= effectiveLimit) {
    alertLevel = 'exceeded_100'
    canTranslate = false
  } else if (usagePercent >= 95) {
    alertLevel = 'critical_95'
    canTranslate = true
  } else if (usagePercent >= 90) {
    alertLevel = 'warning_90'
    canTranslate = true
  }

  const defaultReset = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)
  ).toISOString()

  return {
    monthlyLimit,
    extraCredits,
    effectiveLimit,
    usedMonth,
    usagePercent,
    canTranslate,
    alertLevel,
    cycleResetAt: params.cycleResetAt || defaultReset,
  }
}

/**
 * Helper listo para el futuro panel de Súper Admin:
 * permite ajustar hacia arriba o hacia abajo `translations_used_month`,
 * `monthly_translation_limit` o `extra_credits` sin tocar la lógica del chat.
 */
export async function adminUpdateUserChatQuota(params: {
  ownerUserId: string
  translationsUsedMonth?: number
  monthlyTranslationLimit?: number
  extraCredits?: number
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()

  const { data: existing, error: readErr } = await supabase
    .from('user_plugins')
    .select('config')
    .eq('user_id', params.ownerUserId)
    .eq('plugin_id', 'multilingual_chat')
    .maybeSingle()

  if (readErr) {
    return { ok: false, error: readErr.message }
  }

  const currentConfig = (existing?.config ?? {}) as Record<string, unknown>

  const nextConfig: Record<string, unknown> = {
    ...currentConfig,
  }

  if (typeof params.translationsUsedMonth === 'number') {
    nextConfig.translations_used_month = Math.max(
      0,
      Math.floor(params.translationsUsedMonth)
    )
  }
  if (typeof params.monthlyTranslationLimit === 'number') {
    nextConfig.monthly_translation_limit = Math.max(
      0,
      Math.floor(params.monthlyTranslationLimit)
    )
  }
  if (typeof params.extraCredits === 'number') {
    nextConfig.extra_credits = Math.max(0, Math.floor(params.extraCredits))
  }

  const { error: upsertErr } = await supabase.from('user_plugins').upsert(
    {
      user_id: params.ownerUserId,
      plugin_id: 'multilingual_chat',
      config: nextConfig,
    },
    { onConflict: 'user_id,plugin_id' }
  )

  if (upsertErr) {
    return { ok: false, error: upsertErr.message }
  }

  return { ok: true }
}