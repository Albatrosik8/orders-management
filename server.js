const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API routes
app.post('/api/save', async (req, res) => {
  try {
    // Здесь логика сохранения данных
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при сохранении данных' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    // Здесь логика получения данных
    res.json({ orders: [], columnsOrder: [] });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при чтении данных' });
  }
});

// Для всех остальных запросов возвращаем index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Экспортируем app для Vercel
module.exports = app;

// Запускаем сервер только если не на Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
  });
} 