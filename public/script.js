// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add active class to navigation links based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-link');

    function updateActiveNav() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    }

    // Listen for scroll events
    window.addEventListener('scroll', updateActiveNav);

    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards and items for animation
    const animatedElements = document.querySelectorAll('.food-item, .tip-card, .fact-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add hover effects for food items
    const foodItems = document.querySelectorAll('.food-item');
    foodItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click effects for tip cards
    const tipCards = document.querySelectorAll('.tip-card');
    tipCards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });

    // Custom food items functionality
    let customItems = [];
    
    // Create add item form
    const addItemForm = document.createElement('div');
    addItemForm.id = 'add-item-form';
    addItemForm.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 1000;
        width: 300px;
        font-family: inherit;
        border: 2px solid #667eea;
    `;
    
    addItemForm.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #2d3748; text-align: center;">➕ Добавить продукт</h3>
        <input type="text" id="item-name" placeholder="Название продукта" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none;">
        <select id="item-type" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none;">
            <option value="safe">✅ Безопасный</option>
            <option value="dangerous">❌ Опасный</option>
        </select>
        <button id="add-item-btn" style="width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Добавить</button>
        <button id="toggle-form-btn" style="width: 100%; padding: 8px; margin-top: 10px; background: #e2e8f0; color: #4a5568; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">Скрыть форму</button>
    `;
    
    document.body.appendChild(addItemForm);
    
    // Toggle form visibility
    const toggleFormBtn = document.getElementById('toggle-form-btn');
    const form = document.getElementById('add-item-form');
    let formVisible = true;
    
    toggleFormBtn.addEventListener('click', function() {
        formVisible = !formVisible;
        if (formVisible) {
            form.style.display = 'block';
            this.textContent = 'Скрыть форму';
        } else {
            form.style.display = 'none';
            this.textContent = 'Показать форму';
        }
    });
    
    // API functions
    async function fetchCustomItems() {
        try {
            const response = await fetch('/api/items');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки продуктов:', error);
            showNotification('Ошибка загрузки данных', 'error');
            return [];
        }
    }
    
    async function addCustomItem(name, type) {
        try {
            const response = await fetch('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, type })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка добавления продукта');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка добавления продукта:', error);
            throw error;
        }
    }
    
    async function deleteCustomItem(id) {
        try {
            const response = await fetch(`/api/items/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка удаления продукта');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка удаления продукта:', error);
            throw error;
        }
    }
    
    async function clearCustomItemsByType(type) {
        try {
            const response = await fetch(`/api/items/type/${type}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка очистки продуктов');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка очистки продуктов:', error);
            throw error;
        }
    }
    
    // Add item functionality
    document.getElementById('add-item-btn').addEventListener('click', async function() {
        const itemName = document.getElementById('item-name').value.trim();
        const itemType = document.getElementById('item-type').value;
        
        if (itemName) {
            try {
                const newItem = await addCustomItem(itemName, itemType);
                
                // Add to local array
                customItems.push(newItem);
                
                // Add to UI
                addCustomItemToUI(newItem);
                
                // Clear form
                document.getElementById('item-name').value = '';
                
                // Show success message
                showNotification('Продукт добавлен!', 'success');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        } else {
            showNotification('Введите название продукта', 'error');
        }
    });
    
    // Function to add custom item to UI
    function addCustomItemToUI(item) {
        const category = item.type === 'safe' ? 'safe' : 'dangerous';
        const categoryElement = document.querySelector(`.food-category.${category} .food-grid`);
        
        // Check if custom category exists
        let customCategoryElement = categoryElement.querySelector('.custom-category');
        if (!customCategoryElement) {
            customCategoryElement = document.createElement('div');
            customCategoryElement.className = 'food-item custom-category';
            customCategoryElement.innerHTML = `
                <h4>Мои продукты</h4>
                <ul class="custom-items-list"></ul>
                <button class="clear-custom-btn" style="margin-top: 10px; padding: 5px 10px; background: #f56565; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">Очистить все</button>
            `;
            categoryElement.appendChild(customCategoryElement);
            
            // Add clear functionality
            customCategoryElement.querySelector('.clear-custom-btn').addEventListener('click', async function() {
                if (confirm('Удалить все ваши продукты?')) {
                    try {
                        await clearCustomItemsByType(item.type);
                        customItems = customItems.filter(i => i.type !== item.type);
                        customCategoryElement.remove();
                        showNotification('Продукты удалены', 'success');
                    } catch (error) {
                        showNotification(error.message, 'error');
                    }
                }
            });
        }
        
        const listElement = customCategoryElement.querySelector('.custom-items-list');
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${item.name}
            <button class="remove-item-btn" data-id="${item.id}" style="margin-left: 10px; background: #f56565; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.7rem; padding: 2px 6px;">×</button>
        `;
        listElement.appendChild(listItem);
        
        // Add remove functionality
        listItem.querySelector('.remove-item-btn').addEventListener('click', async function() {
            const itemId = parseInt(this.dataset.id);
            try {
                await deleteCustomItem(itemId);
                customItems = customItems.filter(i => i.id !== itemId);
                listItem.remove();
                
                // Remove custom category if empty
                if (listElement.children.length === 0) {
                    customCategoryElement.remove();
                }
                
                showNotification('Продукт удален', 'success');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }
    
    // Load existing custom items on page load
    async function loadCustomItems() {
        customItems = await fetchCustomItems();
        customItems.forEach(item => addCustomItemToUI(item));
    }
    
    // Initialize custom items
    loadCustomItems();
    
    // Notification function
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #48bb78;' : 'background: #f56565;'}
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Press 'H' to go to home
        if (e.key === 'h' || e.key === 'H') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Add loading animation
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = '🐀 Загружаем информацию о крысах...';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px 40px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 9999;
        font-weight: 500;
    `;
    
    document.body.appendChild(loadingDiv);
    
    // Remove loading after page loads
    setTimeout(() => {
        loadingDiv.remove();
    }, 1000);

    // Add tooltip functionality
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
        position: absolute;
        background: #2d3748;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.9rem;
        pointer-events: none;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(tooltip);

    // Add tooltips to food items
    foodItems.forEach(item => {
        item.addEventListener('mouseenter', function(e) {
            const title = this.querySelector('h4').textContent;
            tooltip.textContent = `Нажмите для получения информации о ${title}`;
            tooltip.style.opacity = '1';
        });
        
        item.addEventListener('mousemove', function(e) {
            tooltip.style.left = e.pageX + 10 + 'px';
            tooltip.style.top = e.pageY - 10 + 'px';
        });
        
        item.addEventListener('mouseleave', function() {
            tooltip.style.opacity = '0';
        });
    });

    // Register Service Worker for PWA functionality
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('🐀 Service Worker зарегистрирован успешно:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content is available, show update notification
                            showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.error('🐀 Ошибка регистрации Service Worker:', error);
            }
        });
    }

    // Show update notification
    function showUpdateNotification() {
        const updateDiv = document.createElement('div');
        updateDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            text-align: center;
        `;
        updateDiv.innerHTML = `
            <p style="margin: 0 0 10px 0; font-weight: 500;">🔄 Доступно обновление!</p>
            <button onclick="window.location.reload()" style="background: white; color: #667eea; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: 500; margin-right: 10px;">Обновить</button>
            <button onclick="this.parentElement.remove()" style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 5px; cursor: pointer;">Позже</button>
        `;
        document.body.appendChild(updateDiv);
    }

    console.log('🐀 Крысиный гид загружен успешно!');
});