/**
 * LizRouter — Omni Moderation middleware
 *
 * Checks every user message against OpenAI's omni-moderation endpoint
 * before it reaches any upstream provider.
 *
 * Policy:
 *   - CSAM / minor-related sexual content  → BLOCK (hard reject, 451)
 *   - Consensual adult NSFW / RP           → ALLOW
 *   - Everything else                      → ALLOW
 *
 * We require BOTH conditions to block:
 *   1. omni-moderation flags sexual/minors = true
 *   2. The text contains explicit minor-related keywords
 * This prevents false positives on adult RP content.
 */

export interface ModerationResult {
  blocked: boolean;
  reason?: string;
}

const CSAM_CATEGORIES = [
  'sexual/minors',
  'child-sexual-abuse-material',
  'sexual_minors',
  'csam',
] as const;

/**
 * Keywords that strongly indicate minor-related sexual content.
 * These are only checked when the moderation flag is already true,
 * so this acts as a confirmation gate, not a standalone filter.
 */
const MINOR_KEYWORDS = [
  /\bchild(?:ren)?\b/i,
  /\bminor\b/i,
  /\bunderage\b/i,
  /\bkid(?:s)?\b/i,
  /\bteen(?:ager)?s?\b/i,
  /\b(?:pre)?teen\b/i,
  /\bjailbait\b/i,
  /\bloli(?:ta|con)?\b/i,
  /\bshota\b/i,
  /\b\d{1,2}\s*(?:year[s]?\s*old|yo|y\/o)\b/i,  // "12 year old", "14yo", "16 y/o"
  /\bgrade\s*\d\b/i,
  /\belementary\s*school\b/i,
  /\bmiddle\s*school\b/i,
  /\bcsam\b/i,
  /\bcp\b/i,
];

function containsMinorKeywords(text: string): boolean {
  return MINOR_KEYWORDS.some((pattern) => pattern.test(text));
}

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

export async function moderateMessages(
  messages: any[],
  openaiApiKey: string
): Promise<ModerationResult> {
  const text = extractText(messages);
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
  if (!result) throw new Error('Unexpected moderation response shape');

  const categories: Record<string, boolean> = result.categories ?? {};
  const scores: Record<string, number> = result.category_scores ?? {};

  // Always log the full moderation result so we can see what's firing
  console.log('[MODERATION] categories:', JSON.stringify(categories));
  console.log('[MODERATION] scores:', JSON.stringify(scores));

  // Check if any CSAM flag is raised
  const csamFlagged = CSAM_CATEGORIES.some((key) => categories[key] === true);

  if (!csamFlagged) {
    console.log('[MODERATION] no CSAM flag — allowing');
    return { blocked: false };
  }

  // Flag was raised — confirm with keyword check before blocking
  const hasMinorKeyword = containsMinorKeywords(text);
  console.log('[MODERATION] CSAM flag raised, minor keyword match:', hasMinorKeyword);

  if (!hasMinorKeyword) {
    return { blocked: false };
  }

  const triggeredCategory = CSAM_CATEGORIES.find((key) => categories[key] === true);
  return {
    blocked: true,
    reason: `CSAM content detected (${triggeredCategory})`,
  };
}

export function buildRejectionResponse(reason?: string) {
  return new Response(
    JSON.stringify({
      error: {
        message: 'Request rejected.',
        type: 'content_policy_violation',
        code: 'content_policy_violation',
      },
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
