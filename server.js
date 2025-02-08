const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для парсинга JSON
app.use(express.json());

// Раздача статических файлов
app.use(express.static('public'));

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, 'data', 'orders.json');

// Создаем директорию для данных, если её нет
async function ensureDataDirectory() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir);
    }
}

// API для сохранения данных
app.post('/api/save', async (req, res) => {
    try {
        await ensureDataDirectory();
        await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при сохранении:', error);
        res.status(500).json({ error: 'Ошибка при сохранении данных' });
    }
});

// API для получения данных
app.get('/api/data', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Файл не существует - возвращаем пустые данные
            res.json({ orders: [], columnsOrder: [] });
        } else {
            console.error('Ошибка при чтении данных:', error);
            res.status(500).json({ error: 'Ошибка при чтении данных' });
        }
    }
});

// Используем middleware
app.use(helmet());
app.use(compression());

// Настройте CORS если необходимо
app.use(cors());

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
}); 