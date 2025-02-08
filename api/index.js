const express = require('express');
const app = express();

app.use(express.json());

// API routes
app.post('/api/save', async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при сохранении данных' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    res.json({ orders: [], columnsOrder: [] });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при чтении данных' });
  }
});

module.exports = app; 