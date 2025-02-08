const express = require('express');
const { kv } = require('@vercel/kv');
const app = express();

app.use(express.json());

// API routes
app.post('/api/save', async (req, res) => {
  try {
    console.log('Начало сохранения:', req.body);
    
    // Проверяем данные
    if (!req.body || !req.body.orders) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    // Сохраняем данные напрямую, без JSON.stringify
    const result = await kv.set('orders_data', {
      orders: req.body.orders,
      columnsOrder: req.body.columnsOrder || []
    });

    console.log('Результат сохранения:', result);
    res.json({ success: true });

  } catch (error) {
    console.error('Ошибка сохранения:', error);
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    console.log('Загрузка данных...');
    
    // Получаем данные напрямую
    const data = await kv.get('orders_data');
    console.log('Загруженные данные:', data);

    res.json(data || { orders: [], columnsOrder: [] });

  } catch (error) {
    console.error('Ошибка загрузки:', error);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

module.exports = app; 