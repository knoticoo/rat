const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3500;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const db = new sqlite3.Database('./food_items.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('✅ Подключение к SQLite базе данных установлено');
    }
});

// Create table for custom food items
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS custom_food_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('safe', 'dangerous')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы:', err.message);
        } else {
            console.log('✅ Таблица custom_food_items создана/проверена');
        }
    });
});

// API Routes

// Get all custom food items
app.get('/api/items', (req, res) => {
    db.all('SELECT * FROM custom_food_items ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add new custom food item
app.post('/api/items', (req, res) => {
    const { name, type } = req.body;
    
    if (!name || !type) {
        res.status(400).json({ error: 'Название и тип продукта обязательны' });
        return;
    }
    
    if (!['safe', 'dangerous'].includes(type)) {
        res.status(400).json({ error: 'Тип должен быть "safe" или "dangerous"' });
        return;
    }
    
    db.run('INSERT INTO custom_food_items (name, type) VALUES (?, ?)', [name, type], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            id: this.lastID, 
            name, 
            type, 
            message: 'Продукт успешно добавлен!' 
        });
    });
});

// Delete custom food item
app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM custom_food_items WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Продукт не найден' });
            return;
        }
        res.json({ message: 'Продукт успешно удален!' });
    });
});

// Clear all custom items of a specific type
app.delete('/api/items/type/:type', (req, res) => {
    const { type } = req.params;
    
    if (!['safe', 'dangerous'].includes(type)) {
        res.status(400).json({ error: 'Недопустимый тип продукта' });
        return;
    }
    
    db.run('DELETE FROM custom_food_items WHERE type = ?', [type], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            message: `Все продукты типа "${type}" удалены!`,
            deletedCount: this.changes 
        });
    });
});

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🐀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Откройте http://localhost:${PORT} в браузере`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Завершение работы сервера...');
    db.close((err) => {
        if (err) {
            console.error('Ошибка закрытия базы данных:', err.message);
        } else {
            console.log('✅ База данных закрыта');
        }
        process.exit(0);
    });
});