/**
 * LizRouter — Omni Moderation middleware
 *
 * Checks every user message against OpenAI's omni-moderation endpoint
 * before it reaches any upstream provider.
 *
 * Policy:
 *   - CSAM / minor-related sexual content  → BLOCK (hard reject, 451)
 *   - Consensual adult NSFW                → ALLOW (not our concern)
 *   - Everything else                      → ALLOW (moderation is CSAM-scoped only)
 */

export interface ModerationResult {
  blocked: boolean;
  /** Human-readable reason, only set when blocked === true */
  reason?: string;
}

/**
 * Categories in the omni-moderation response that indicate CSAM or
 * minor-related sexual content. We only block on these — nothing else.
 *
 * Reference: https://platform.openai.com/docs/api-reference/moderations
 */
const CSAM_CATEGORIES = [
  'sexual/minors',
  'child-sexual-abuse-material',
  // omni-moderation-latest uses these keys:
  'sexual_minors',
  'csam',
] as const;

/**
 * Extract all text content from a chat messages array.
 * Handles both plain string content and the content-parts array format.
 */
function extractText(messages: any[]): string {
  if (!Array.isArray(messages)) return '';

  return messages
    .filter((m) => m.role === 'user' || m.role === 'system')
    .map((m) => {
      if (typeof m.content === 'string') return m.content;
      if (Array.isArray(m.content)) {
        return m.content
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text ?? '')
          .join(' ');
      }
      return '';
    })
    .join('\n')
    .trim();
}

/**
 * Run Omni Moderation on the given text.
 * Returns { blocked: true, reason } if CSAM is detected, otherwise { blocked: false }.
 *
 * Throws only on hard network/API failures — callers should decide whether to
 * fail-open or fail-closed in that case.
 */
export async function moderateMessages(
  messages: any[],
  openaiApiKey: string
): Promise<ModerationResult> {
  const text = extractText(messages);

  // Nothing to moderate (e.g. assistant-only messages, empty body)
  if (!text) return { blocked: false };

  const response = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'omni-moderation-latest',
      input: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Moderation API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const result = data?.results?.[0];

  if (!result) {
    throw new Error('Unexpected moderation response shape');
  }

  // Check only CSAM-related category flags
  const categories: Record<string, boolean> = result.categories ?? {};

  for (const key of CSAM_CATEGORIES) {
    if (categories[key] === true) {
      return {
        blocked: true,
        reason: `Content flagged: ${key}`,
      };
    }
  }

  // Also check category_scores for any CSAM key above a tight threshold (0.5)
  // This catches cases where the flag is false but the score is high
  const scores: Record<string, number> = result.category_scores ?? {};
  for (const key of CSAM_CATEGORIES) {
    if ((scores[key] ?? 0) >= 0.5) {
      return {
        blocked: true,
        reason: `Content score exceeded threshold for: ${key} (score: ${scores[key].toFixed(3)})`,
      };
    }
  }

  return { blocked: false };
}

/**
 * Build the standard rejection response for blocked CSAM content.
 * Returns HTTP 451 (Unavailable For Legal Reasons) with an empty choices array
 * so OpenAI-compatible clients don't crash.
 */
export function buildRejectionResponse(reason?: string) {
  return new Response(
    JSON.stringify({
      error: {
        message: 'Request rejected.',
        type: 'content_policy_violation',
        code: 'content_policy_violation',
      },
      // Empty choices keeps SDK clients from throwing on missing fields
      choices: [],
    }),
    {
      status: 451,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
