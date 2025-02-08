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
    
    if (!req.body || !req.body.orders) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    // Сохраняем данные в Edge Config
    await edge.set('orders', req.body.orders);
    await edge.set('columnsOrder', req.body.columnsOrder || []);
    
    console.log('Данные сохранены');
    res.json({ success: true });

  } catch (error) {
    console.error('Ошибка сохранения:', error);
    res.status(500).json({ 
      error: 'Ошибка сохранения',
      details: error.message 
    });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    console.log('Загрузка данных...');
    
    // Получаем данные из Edge Config
    const [orders, columnsOrder] = await Promise.all([
      edge.get('orders'),
      edge.get('columnsOrder')
    ]);

    console.log('Данные загружены:', { orders, columnsOrder });
    
    res.json({
      orders: orders || [],
      columnsOrder: columnsOrder || []
    });

  } catch (error) {
    console.error('Ошибка загрузки:', error);
    res.status(500).json({ 
      error: 'Ошибка загрузки',
      details: error.message 
    });
  }
});

module.exports = app; 