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
      model: process.env.OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Unable to generate analysis at this time.';
}
