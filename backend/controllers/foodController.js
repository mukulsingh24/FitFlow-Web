const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Configurable via .env — must be a vision-capable model on Groq
const MODEL_NAME = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
const MAX_RETRIES = Number(process.env.GROQ_MAX_RETRIES) || 3;

const PROMPT = `You are a professional nutritionist AI. Analyze the food in this image and return a JSON object with EXACTLY this structure (no markdown, no code fences, just raw JSON):
{
  "foodName": "Name of the food/dish",
  "calories": <number>,
  "confidence": <number between 0 and 100>,
  "macros": {
    "protein": <grams as number>,
    "carbs": <grams as number>,
    "fats": <grams as number>
  },
  "suggestions": ["suggestion 1", "suggestion 2"],
  "detailedAnalysis": "A 2-3 sentence analysis of the meal's nutritional value, balance, and any health considerations."
}

Rules:
- Estimate realistic calorie and macro values based on a typical serving size visible in the image.
- Confidence should reflect how clearly the food is identifiable.
- Provide 2-4 actionable dietary suggestions.
- If the image does not contain food, set foodName to "Not Food", calories to 0, confidence to 0, and explain in detailedAnalysis.
- Return ONLY valid JSON. No extra text.`;

/**
 * Sleep helper for retry backoff
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call Groq with automatic retry + exponential backoff for 429 / 503 errors
 */
async function callGroqWithRetry(imageBase64, mimeType) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      });

      return chatCompletion.choices[0].message.content;
    } catch (err) {
      const status = err.status || err.statusCode;
      const isRetryable = status === 429 || status === 503;

      if (isRetryable && attempt < MAX_RETRIES) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 16000);
        console.warn(`Groq ${status} on attempt ${attempt}/${MAX_RETRIES} — retrying in ${delayMs}ms...`);
        await sleep(delayMs);
        continue;
      }

      // Not retryable, or last attempt — rethrow
      throw err;
    }
  }
}

/**
 * POST /api/food/analyze
 * Accepts a base64-encoded image and returns nutrition analysis from Groq.
 */
async function analyzeFood(req, res) {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: 'imageBase64 and mimeType are required' });
    }

    let text = await callGroqWithRetry(imageBase64, mimeType);

    // Strip markdown code fences if the model wraps the response
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    const parsed = JSON.parse(text);

    return res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Groq analysis error:', err);

    const status = err.status || err.statusCode;

    // Rate-limit — tell the user clearly
    if (status === 429) {
      return res.status(429).json({
        error: 'Please try again shortly.',
        retryable: true,
      });
    }

    // JSON parse failure
    if (err instanceof SyntaxError) {
      return res.status(500).json({
        error: 'Failed to parse response as JSON',
        raw: err.message,
      });
    }

    return res.status(500).json({ error: 'Failed to analyze food image', details: err.message });
  }
}

module.exports = { analyzeFood };
