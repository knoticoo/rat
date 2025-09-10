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

// Create tables for categories and custom food items
db.serialize(() => {
    // Create categories table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('safe', 'dangerous')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы categories:', err.message);
        } else {
            console.log('✅ Таблица categories создана/проверена');
        }
    });

    // Create custom food items table with category reference
    db.run(`CREATE TABLE IF NOT EXISTS custom_food_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('safe', 'dangerous')),
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы custom_food_items:', err.message);
        } else {
            console.log('✅ Таблица custom_food_items создана/проверена');
        }
    });

    // Insert default categories if they don't exist
    const defaultCategories = [
        { name: 'vegetables', display_name: 'Овощи', type: 'safe' },
        { name: 'fruits', display_name: 'Фрукты', type: 'safe' },
        { name: 'proteins', display_name: 'Белки', type: 'safe' },
        { name: 'grains', display_name: 'Зерновые', type: 'safe' },
        { name: 'dairy', display_name: 'Молочные продукты', type: 'safe' },
        { name: 'nuts', display_name: 'Орехи и семена', type: 'safe' },
        { name: 'toxic', display_name: 'Токсичные', type: 'dangerous' },
        { name: 'harmful', display_name: 'Вредные', type: 'dangerous' },
        { name: 'processed', display_name: 'Обработанные продукты', type: 'dangerous' }
    ];

    defaultCategories.forEach(category => {
        db.run(`INSERT OR IGNORE INTO categories (name, display_name, type) VALUES (?, ?, ?)`, 
            [category.name, category.display_name, category.type], (err) => {
            if (err) {
                console.error(`Ошибка добавления категории ${category.name}:`, err.message);
            }
        });
    });
});

// API Routes

// Get all categories
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY type, display_name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get categories by type
app.get('/api/categories/:type', (req, res) => {
    const { type } = req.params;
    
    if (!['safe', 'dangerous'].includes(type)) {
        res.status(400).json({ error: 'Недопустимый тип категории' });
        return;
    }
    
    db.all('SELECT * FROM categories WHERE type = ? ORDER BY display_name', [type], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add new category
app.post('/api/categories', (req, res) => {
    const { name, display_name, type } = req.body;
    
    if (!name || !display_name || !type) {
        res.status(400).json({ error: 'Название, отображаемое имя и тип категории обязательны' });
        return;
    }
    
    if (!['safe', 'dangerous'].includes(type)) {
        res.status(400).json({ error: 'Тип должен быть "safe" или "dangerous"' });
        return;
    }
    
    db.run('INSERT INTO categories (name, display_name, type) VALUES (?, ?, ?)', [name, display_name, type], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                res.status(400).json({ error: 'Категория с таким именем уже существует' });
                return;
            }
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            id: this.lastID, 
            name, 
            display_name, 
            type,
            message: 'Категория успешно добавлена!' 
        });
    });
});

// Get all custom food items with category information
app.get('/api/items', (req, res) => {
    db.all(`
        SELECT cfi.*, c.display_name as category_name 
        FROM custom_food_items cfi 
        LEFT JOIN categories c ON cfi.category_id = c.id 
        ORDER BY cfi.created_at DESC
    `, (err, rows) => {
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