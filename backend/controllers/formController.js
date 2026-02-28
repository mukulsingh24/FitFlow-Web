const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL_NAME = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

async function analyzeForm(req, res) {
  try {
    const { imageBase64, mimeType, exercise } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }
    if (!exercise) {
      return res.status(400).json({ error: 'exercise name is required' });
    }

    const imgMime = mimeType || 'image/jpeg';

    const FORM_PROMPT = `You are a professional fitness coach and exercise form analyst. Analyze this image of a person performing "${exercise}".

Carefully examine the person's posture, body alignment, joint angles, and overall form in the image.

Provide your analysis in this exact format:

✅ What's Good:
- List specific things the person is doing correctly (body alignment, stance, grip, etc.)
- Be specific about what you can see in the image

⚠️ What to Fix:
- List specific form issues you can identify from the image
- Mention joint angles, spine alignment, weight distribution issues, etc.
- If the form looks good, still suggest minor refinements

💡 Pro Tips:
- Give 2-3 actionable tips to improve their ${exercise} form
- Include cues they can think about during the exercise

⚡ Overall Rating: Give a form score out of 10

Important: Base your analysis on what you can ACTUALLY see in the image. If the image is unclear or doesn't show exercise form, say so honestly. Be encouraging but accurate.`;

    const chatCompletion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: FORM_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: `data:${imgMime};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const reply = chatCompletion.choices[0].message.content;

    return res.json({ success: true, feedback: reply });
  } catch (err) {
    console.error('Form analysis error:', err);

    const status = err.status || err.statusCode;
    if (status === 429) {
      return res.status(429).json({
        error: 'Rate limit reached. Please wait a moment and try again.',
        retryable: true,
      });
    }

    return res.status(500).json({
      error: 'Failed to analyze form. Please try again.',
    });
  }
}

module.exports = { analyzeForm };
