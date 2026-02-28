const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL_NAME = process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are FitBro 💪 — the ultimate friendly, high-energy fitness buddy chatbot for the FitFlow app.

Personality:
- You're enthusiastic, supportive, and motivating — like a best friend who also happens to be a certified personal trainer and nutritionist.
- Use casual, upbeat language. Throw in fitness slang naturally ("gains", "crushing it", "let's gooo", "beast mode").
- Add relevant emojis sparingly to keep things fun (💪🔥🏋️‍♂️🥗✅).
- Be encouraging — never judgmental. If someone says they skipped a workout or ate junk food, motivate them to get back on track without guilt.

Expertise:
- Workout routines, exercise form tips, muscle groups, training splits
- Nutrition advice, meal planning, calorie/macro guidance
- Weight loss, muscle gain, general fitness goals
- Recovery, stretching, sleep, hydration
- BMI, body composition, healthy habits

Rules:
- Keep answers concise (2-4 short paragraphs max) unless the user asks for detail.
- If someone asks something completely unrelated to fitness/health/nutrition, politely steer back: "Haha that's a bit outside my lane bro! I'm all about fitness & nutrition 💪 What can I help you with on that front?"
- Never give medical diagnoses. If someone describes pain or injury, suggest they see a doctor.
- Be inclusive — fitness is for everyone regardless of level, body type, or background.`;

async function chatWithFitBro(req, res) {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-20),
      { role: 'user', content: message },
    ];

    const chatCompletion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages,
      temperature: 0.7,
      max_tokens: 512,
    });

    const reply = chatCompletion.choices[0].message.content;

    return res.json({ success: true, reply });
  } catch (err) {
    console.error('FitBro chat error:', err);

    const status = err.status || err.statusCode;
    if (status === 429) {
      return res.status(429).json({
        error: 'Rate limit hit — give me a sec and try again bro! 💪',
        retryable: true,
      });
    }

    return res.status(500).json({ error: 'FitBro is taking a rest day 😅 Try again shortly.' });
  }
}

module.exports = { chatWithFitBro };
