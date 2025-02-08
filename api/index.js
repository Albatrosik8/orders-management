const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

app.use(express.json());

// Путь к файлу данных
const DATA_FILE = path.join(process.cwd(), 'data', 'orders.json');

// Создаем директорию data, если её нет
async function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// API routes
app.post('/api/save', async (req, res) => {
  try {
    console.log('Сохранение данных:', req.body);
    
    if (!req.body || !req.body.orders === undefined) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    const data = {
      orders: req.body.orders,
      columnsOrder: req.body.columnsOrder || []
    };

    // Создаем директорию и сохраняем данные
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    
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
    
    // Пытаемся прочитать файл
    try {
      const content = await fs.readFile(DATA_FILE, 'utf8');
      const data = JSON.parse(content);
      console.log('Загруженные данные:', data);
      res.json(data);
    } catch (err) {
      // Если файл не существует, возвращаем пустые данные
      const defaultData = { orders: [], columnsOrder: [] };
      console.log('Файл не найден, возвращаем пустые данные');
      res.json(defaultData);
    }

  } catch (error) {
    console.error('Ошибка загрузки:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app; 