const express = require('express');
const { createClient } = require('@vercel/edge-config');
const app = express();

app.use(express.json());

// Создаем клиент Edge Config
const edge = createClient(process.env.EDGE_CONFIG);

// API routes
app.post('/api/save', async (req, res) => {
  try {
    console.log('Сохранение данных:', req.body);
    
    if (!req.body || !req.body.orders === undefined) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    // Сохраняем данные по одному
    await edge.set('orders', JSON.stringify(req.body.orders));
    await edge.set('columnsOrder', JSON.stringify(req.body.columnsOrder || []));
    
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
    
    // Получаем и парсим данные
    const ordersStr = await edge.get('orders');
    const columnsOrderStr = await edge.get('columnsOrder');

    const orders = ordersStr ? JSON.parse(ordersStr) : [];
    const columnsOrder = columnsOrderStr ? JSON.parse(columnsOrderStr) : [];

    console.log('Загруженные данные:', { orders, columnsOrder });
    
    res.json({
      orders: orders,
      columnsOrder: columnsOrder
    });

  } catch (error) {
    console.error('Ошибка загрузки:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app; 