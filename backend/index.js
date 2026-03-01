const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const foodRoutes = require('./routes/foodRoutes');
const chatRoutes = require('./routes/chatRoutes');
const formRoutes = require('./routes/formRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const AI_ENABLED = process.env.GROQ_ENABLED !== 'false';

function requireAiEnabled(req, res, next) {
  if (!AI_ENABLED) {
    return res.status(503).json({
      success: false,
      error: 'AI features are temporarily offline, will Resume Shortly! 🚧',
    });
  }
  next();
}

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Protect AI routes behind the toggle
app.use('/api/food', requireAiEnabled, foodRoutes);
app.use('/api/chat', requireAiEnabled, chatRoutes);
app.use('/api/form', requireAiEnabled, formRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'FitFlow API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
