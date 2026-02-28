const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const foodRoutes = require('./routes/foodRoutes');
const chatRoutes = require('./routes/chatRoutes');
const formRoutes = require('./routes/formRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use('/api/food', foodRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/form', formRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'FitFlow API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
