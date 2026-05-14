/**
 * Shared AI helper for OpenRouter API calls
 */
export async function getAIResponse(systemPrompt, userMessage) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) throw new Error('OpenRouter error: ' + response.status);

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Unable to generate analysis at this time.';
}

/**
 * Robust JSON parser - 3 strategies
 */
export function parseAIJson(text) {
  // Strategy 1: direct parse
  try { return JSON.parse(text); } catch (_) {}

  // Strategy 2: extract from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch (_) {}
  }

  // Strategy 3: find first { ... } or [ ... ]
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch (_) {}
  }

  return null;
}

/**
 * Crisis keyword detection
 */
const CRISIS_KEYWORDS = ['suicide', 'kill myself', 'end my life', 'self-harm', 'hurt myself', 'hopeless', 'want to die', 'no reason to live'];

export function detectCrisis(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
}

export const CRISIS_RESOURCES = [
  { name: '988 Suicide & Crisis Lifeline', number: '988', description: 'Call or text 988 (US)' },
  { name: 'Crisis Text Line', number: 'Text HOME to 741741', description: 'Free 24/7 crisis support' },
  { name: 'International Association for Suicide Prevention', number: 'https://www.iasp.info/resources/Crisis_Centres/', description: 'Global crisis centers directory' },
];
