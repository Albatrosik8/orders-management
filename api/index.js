const express = require('express');
const { createClient } = require('@vercel/edge-config');
const app = express();

app.use(express.json());

// Создаем клиент Edge Config
const config = createClient(process.env.EDGE_CONFIG);

// API routes
app.post('/api/save', async (req, res) => {
  try {
    console.log('Сохранение данных:', req.body);
    
    if (!req.body || !req.body.orders === undefined) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    // Сохраняем все данные одним объектом
    const data = {
      orders: req.body.orders,
      columnsOrder: req.body.columnsOrder || []
    };

    // Используем метод write для сохранения
    await config.write({
      items: [{
        key: 'app_data',
        value: data
      }]
    });
    
    console.log('Данные сохранены');
    res.json({ success: true });

  } catch (error) {
    console.error('Ошибка сохранения:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    console.log('Загрузка данных...');
    
    // Получаем данные
    const data = await config.get('app_data');
    const defaultData = { orders: [], columnsOrder: [] };

    console.log('Загруженные данные:', data || defaultData);
    
    res.json(data || defaultData);

  } catch (error) {
    console.error('Ошибка загрузки:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app; 