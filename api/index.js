const express = require('express');
const { kv } = require('@vercel/kv');
const app = express();

app.use(express.json());

// API routes
app.post('/api/save', async (req, res) => {
  try {
    // Сохраняем данные в KV storage
    await kv.set('ordersData', {
      orders: req.body.orders,
      columnsOrder: req.body.columnsOrder
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Ошибка при сохранении данных' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    // Получаем данные из KV storage
    const data = await kv.get('ordersData');
    res.json(data || { orders: [], columnsOrder: [] });
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ error: 'Ошибка при чтении данных' });
  }
});

module.exports = app; 