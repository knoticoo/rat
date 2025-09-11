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
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы custom_food_items:', err.message);
        } else {
            console.log('✅ Таблица custom_food_items создана/проверена');
        }
    });

    // Add description column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE custom_food_items ADD COLUMN description TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Ошибка добавления колонки description:', err.message);
        } else if (!err) {
            console.log('✅ Колонка description добавлена');
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
        { name: 'Морковь', category_name: 'vegetables', type: 'safe', description: 'Богата витамином А, полезна для зрения. Можно давать сырой или варёной, но лучше натереть на тёрке.' },
        { name: 'Брокколи', category_name: 'vegetables', type: 'safe', description: 'Содержит много витаминов и минералов. Давайте в небольших количествах, может вызывать газообразование.' },
        { name: 'Цветная капуста', category_name: 'vegetables', type: 'safe', description: 'Отличный источник витамина С. Лучше давать варёной или приготовленной на пару.' },
        { name: 'Огурцы', category_name: 'vegetables', type: 'safe', description: 'Содержат много воды, хорошо утоляют жажду. Можно давать с кожурой, но тщательно вымыть.' },
        { name: 'Кабачки', category_name: 'vegetables', type: 'safe', description: 'Низкокалорийные, содержат калий. Можно давать сырыми или варёными.' },
        { name: 'Сладкий перец', category_name: 'vegetables', type: 'safe', description: 'Богат витамином С. Удалите семена и перегородки перед подачей.' },
        
        // Safe fruits
        { name: 'Яблоки (без семян)', category_name: 'fruits', type: 'safe', description: 'Семена содержат цианид! Давайте только мякоть без сердцевины. Богаты клетчаткой.' },
        { name: 'Бананы', category_name: 'fruits', type: 'safe', description: 'Высокое содержание калия, но много сахара. Давайте в умеренных количествах как лакомство.' },
        { name: 'Виноград', category_name: 'fruits', type: 'safe', description: 'Сладкое лакомство, но много сахара. Давайте по 1-2 ягоды в день.' },
        { name: 'Клубника', category_name: 'fruits', type: 'safe', description: 'Богата витамином С. Тщательно мойте перед подачей, удаляйте листья.' },
        { name: 'Груши', category_name: 'fruits', type: 'safe', description: 'Сладкие и сочные, но много сахара. Давайте без сердцевины и семян.' },
        { name: 'Персики', category_name: 'fruits', type: 'safe', description: 'Сочные и сладкие. Удалите косточку и кожуру перед подачей.' },
        
        // Safe proteins
        { name: 'Варёные яйца', category_name: 'proteins', type: 'safe', description: 'Отличный источник белка. Давайте только варёными, можно с желтком и белком.' },
        { name: 'Творог (нежирный)', category_name: 'proteins', type: 'safe', description: 'Богат кальцием и белком. Выбирайте нежирный, без добавок и сахара.' },
        { name: 'Куриная грудка', category_name: 'proteins', type: 'safe', description: 'Отличный источник белка. Давайте только варёной, без кожи и костей.' },
        { name: 'Рыба (варёная)', category_name: 'proteins', type: 'safe', description: 'Богата омега-3 кислотами. Только варёная, без костей и кожи.' },
        { name: 'Йогурт (без сахара)', category_name: 'proteins', type: 'safe', description: 'Полезен для пищеварения. Только натуральный, без сахара и добавок.' },
        
        // Safe grains
        { name: 'Овсянка', category_name: 'grains', type: 'safe', description: 'Богата клетчаткой. Давайте варёной, без сахара и молока.' },
        { name: 'Рис (варёный)', category_name: 'grains', type: 'safe', description: 'Легко усваивается. Лучше коричневый рис, варёный без соли.' },
        { name: 'Пшеница', category_name: 'grains', type: 'safe', description: 'Можно давать пророщенную пшеницу - очень полезно!' },
        { name: 'Ячмень', category_name: 'grains', type: 'safe', description: 'Богат клетчаткой. Давайте варёным, в небольших количествах.' },
        { name: 'Кукуруза', category_name: 'grains', type: 'safe', description: 'Сладкая и питательная. Давайте варёной, без масла и соли.' },
        
        // Dangerous toxic
        { name: 'Шоколад', category_name: 'toxic', type: 'dangerous', description: 'Содержит теобромин - яд для крыс! Может вызвать смерть даже в малых количествах.' },
        { name: 'Лук и чеснок', category_name: 'toxic', type: 'dangerous', description: 'Содержат вещества, разрушающие эритроциты. Очень опасны для крыс!' },
        { name: 'Авокадо', category_name: 'toxic', type: 'dangerous', description: 'Содержит персин - токсин, опасный для крыс. Может вызвать проблемы с сердцем.' },
        { name: 'Сырой картофель', category_name: 'toxic', type: 'dangerous', description: 'Содержит соланин - ядовитое вещество. Варёный картофель безопасен.' },
        { name: 'Косточки фруктов', category_name: 'toxic', type: 'dangerous', description: 'Содержат цианид! Никогда не давайте косточки яблок, вишен, персиков.' },
        
        // Dangerous harmful
        { name: 'Жирная пища', category_name: 'harmful', type: 'dangerous', description: 'Может вызвать ожирение и проблемы с печенью. Крысы склонны к лишнему весу.' },
        { name: 'Солёные продукты', category_name: 'harmful', type: 'dangerous', description: 'Избыток соли вреден для почек. Крысы не нуждаются в дополнительной соли.' },
        { name: 'Сладости', category_name: 'harmful', type: 'dangerous', description: 'Вызывают ожирение и диабет. Крысы любят сладкое, но это вредно для них.' },
        { name: 'Алкоголь', category_name: 'harmful', type: 'dangerous', description: 'Алкоголь ядовит для крыс! Даже капля может быть смертельной.' },
        { name: 'Кофеин', category_name: 'harmful', type: 'dangerous', description: 'Стимулирует нервную систему, может вызвать проблемы с сердцем.' }
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
                    db.run(`INSERT OR IGNORE INTO custom_food_items (name, type, category_id, description) VALUES (?, ?, ?, ?)`, 
                        [item.name, item.type, category.id, item.description], (err) => {
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
    const { name, type, category_id, description } = req.body;
    
    if (!name || !type) {
        res.status(400).json({ error: 'Название и тип продукта обязательны' });
        return;
    }
    
    if (!['safe', 'dangerous'].includes(type)) {
        res.status(400).json({ error: 'Тип должен быть "safe" или "dangerous"' });
        return;
    }
    
    db.run('INSERT INTO custom_food_items (name, type, category_id, description) VALUES (?, ?, ?, ?)', [name, type, category_id, description || ''], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            id: this.lastID, 
            name, 
            type, 
            category_id,
            description: description || '',
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