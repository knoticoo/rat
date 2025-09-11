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
        { name: 'toxic', display_name: 'Токсичные', type: 'dangerous' },
        { name: 'harmful', display_name: 'Вредные', type: 'dangerous' }
    ];

    defaultCategories.forEach(category => {
        db.run(`INSERT OR IGNORE INTO categories (name, display_name, type) VALUES (?, ?, ?)`, 
            [category.name, category.display_name, category.type], (err) => {
            if (err) {
                console.error(`Ошибка добавления категории ${category.name}:`, err.message);
            }
        });
    });

    // Insert default food items
    const defaultFoodItems = [
        // Safe vegetables
        { name: 'Морковь', category_name: 'vegetables', type: 'safe' },
        { name: 'Брокколи', category_name: 'vegetables', type: 'safe' },
        { name: 'Цветная капуста', category_name: 'vegetables', type: 'safe' },
        { name: 'Огурцы', category_name: 'vegetables', type: 'safe' },
        { name: 'Кабачки', category_name: 'vegetables', type: 'safe' },
        { name: 'Сладкий перец', category_name: 'vegetables', type: 'safe' },
        
        // Safe fruits
        { name: 'Яблоки (без семян)', category_name: 'fruits', type: 'safe' },
        { name: 'Бананы', category_name: 'fruits', type: 'safe' },
        { name: 'Виноград', category_name: 'fruits', type: 'safe' },
        { name: 'Клубника', category_name: 'fruits', type: 'safe' },
        { name: 'Груши', category_name: 'fruits', type: 'safe' },
        { name: 'Персики', category_name: 'fruits', type: 'safe' },
        
        // Safe proteins
        { name: 'Варёные яйца', category_name: 'proteins', type: 'safe' },
        { name: 'Творог (нежирный)', category_name: 'proteins', type: 'safe' },
        { name: 'Куриная грудка', category_name: 'proteins', type: 'safe' },
        { name: 'Рыба (варёная)', category_name: 'proteins', type: 'safe' },
        { name: 'Йогурт (без сахара)', category_name: 'proteins', type: 'safe' },
        
        // Safe grains
        { name: 'Овсянка', category_name: 'grains', type: 'safe' },
        { name: 'Рис (варёный)', category_name: 'grains', type: 'safe' },
        { name: 'Пшеница', category_name: 'grains', type: 'safe' },
        { name: 'Ячмень', category_name: 'grains', type: 'safe' },
        { name: 'Кукуруза', category_name: 'grains', type: 'safe' },
        
        // Dangerous toxic
        { name: 'Шоколад', category_name: 'toxic', type: 'dangerous' },
        { name: 'Лук и чеснок', category_name: 'toxic', type: 'dangerous' },
        { name: 'Авокадо', category_name: 'toxic', type: 'dangerous' },
        { name: 'Сырой картофель', category_name: 'toxic', type: 'dangerous' },
        { name: 'Косточки фруктов', category_name: 'toxic', type: 'dangerous' },
        
        // Dangerous harmful
        { name: 'Жирная пища', category_name: 'harmful', type: 'dangerous' },
        { name: 'Солёные продукты', category_name: 'harmful', type: 'dangerous' },
        { name: 'Сладости', category_name: 'harmful', type: 'dangerous' },
        { name: 'Алкоголь', category_name: 'harmful', type: 'dangerous' },
        { name: 'Кофеин', category_name: 'harmful', type: 'dangerous' }
    ];

    // Insert default food items after categories are created
    setTimeout(() => {
        defaultFoodItems.forEach(item => {
            db.get(`SELECT id FROM categories WHERE name = ?`, [item.category_name], (err, category) => {
                if (err) {
                    console.error(`Ошибка поиска категории ${item.category_name}:`, err.message);
                    return;
                }
                if (category) {
                    db.run(`INSERT OR IGNORE INTO custom_food_items (name, type, category_id) VALUES (?, ?, ?)`, 
                        [item.name, item.type, category.id], (err) => {
                        if (err) {
                            console.error(`Ошибка добавления продукта ${item.name}:`, err.message);
                        }
                    });
                }
            });
        });
    }, 1000);
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

// Get food items by category
app.get('/api/items/category/:categoryId', (req, res) => {
    const { categoryId } = req.params;
    
    db.all(`
        SELECT cfi.*, c.display_name as category_name 
        FROM custom_food_items cfi 
        LEFT JOIN categories c ON cfi.category_id = c.id 
        WHERE cfi.category_id = ?
        ORDER BY cfi.created_at DESC
    `, [categoryId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get all food items grouped by category
app.get('/api/items/grouped', (req, res) => {
    db.all(`
        SELECT cfi.*, c.display_name as category_name, c.name as category_key, c.type as category_type
        FROM custom_food_items cfi 
        LEFT JOIN categories c ON cfi.category_id = c.id 
        ORDER BY c.type, c.display_name, cfi.created_at DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Group items by category
        const grouped = {};
        rows.forEach(item => {
            const categoryKey = item.category_key || 'uncategorized';
            if (!grouped[categoryKey]) {
                grouped[categoryKey] = {
                    category_name: item.category_name || 'Без категории',
                    category_type: item.category_type || 'safe',
                    items: []
                };
            }
            grouped[categoryKey].items.push(item);
        });
        
        res.json(grouped);
    });
});

// Add new custom food item
app.post('/api/items', (req, res) => {
    const { name, type, category_id } = req.body;
    
    if (!name || !type) {
        res.status(400).json({ error: 'Название и тип продукта обязательны' });
        return;
    }
    
    if (!['safe', 'dangerous'].includes(type)) {
        res.status(400).json({ error: 'Тип должен быть "safe" или "dangerous"' });
        return;
    }
    
    db.run('INSERT INTO custom_food_items (name, type, category_id) VALUES (?, ?, ?)', [name, type, category_id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            id: this.lastID, 
            name, 
            type, 
            category_id,
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