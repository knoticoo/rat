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
    const foodItemElements = document.querySelectorAll('.food-item');
    foodItemElements.forEach(item => {
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

    // Dynamic food items functionality
    let categories = [];
    let foodItems = {};
    
    // Create modal for adding items
    const addItemModal = document.createElement('div');
    addItemModal.id = 'add-item-modal';
    addItemModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 1000;
        display: none;
        justify-content: center;
        align-items: center;
    `;
    
    addItemModal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); width: 90%; max-width: 500px; position: relative;">
            <button id="close-modal-btn" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
            <h3 style="margin: 0 0 20px 0; color: #2d3748; text-align: center; font-size: 1.5rem;">➕ Добавить продукт</h3>
            <input type="text" id="item-name" placeholder="Название продукта" style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #e2e8f0; border-radius: 8px; outline: none; font-size: 1rem; box-sizing: border-box;">
            <select id="item-type" style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #e2e8f0; border-radius: 8px; outline: none; font-size: 1rem; box-sizing: border-box;">
                <option value="safe">✅ Безопасный</option>
                <option value="dangerous">❌ Опасный</option>
            </select>
            <select id="item-category" style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #e2e8f0; border-radius: 8px; outline: none; font-size: 1rem; box-sizing: border-box;">
                <option value="">Выберите категорию...</option>
            </select>
            <textarea id="item-description" placeholder="Описание продукта (необязательно)" style="width: 100%; padding: 12px; margin-bottom: 20px; border: 2px solid #e2e8f0; border-radius: 8px; outline: none; font-size: 1rem; box-sizing: border-box; min-height: 80px; resize: vertical; font-family: inherit;"></textarea>
            <button id="add-item-btn" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 1rem;">Добавить продукт</button>
        </div>
    `;
    
    document.body.appendChild(addItemModal);
    
    // Header button functionality
    const addItemHeaderBtn = document.getElementById('add-item-header-btn');
    const modal = document.getElementById('add-item-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    console.log('🐀 Debug: addItemHeaderBtn found:', !!addItemHeaderBtn);
    console.log('🐀 Debug: modal found:', !!modal);
    console.log('🐀 Debug: closeModalBtn found:', !!closeModalBtn);
    
    if (addItemHeaderBtn) {
        addItemHeaderBtn.addEventListener('click', function() {
            console.log('🐀 Debug: Add button clicked');
            modal.style.display = 'flex';
            document.getElementById('item-name').focus();
        });
    } else {
        console.error('🐀 Error: Add button not found!');
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            document.getElementById('item-name').value = '';
            document.getElementById('item-description').value = '';
        });
    } else {
        console.error('🐀 Error: Close button not found!');
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.getElementById('item-name').value = '';
                document.getElementById('item-description').value = '';
            }
        });
    } else {
        console.error('🐀 Error: Modal not found!');
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
            document.getElementById('item-name').value = '';
            document.getElementById('item-description').value = '';
        }
    });
    
    // API functions
    async function fetchCategories() {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) throw new Error('Ошибка загрузки категорий');
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            showNotification('Ошибка загрузки категорий', 'error');
            return [];
        }
    }
    
    async function fetchFoodItems() {
        try {
            const response = await fetch('/api/items/grouped');
            if (!response.ok) throw new Error('Ошибка загрузки продуктов');
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки продуктов:', error);
            showNotification('Ошибка загрузки продуктов', 'error');
            return {};
        }
    }
    
    async function addFoodItem(name, type, category_id, description = '') {
        try {
            const response = await fetch('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, type, category_id, description })
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
    
    async function deleteFoodItem(id) {
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
    
    // Add item functionality
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', async function() {
        const itemName = document.getElementById('item-name').value.trim();
        const itemType = document.getElementById('item-type').value;
        const categoryId = document.getElementById('item-category').value;
        const itemDescription = document.getElementById('item-description').value.trim();
        
        if (itemName && categoryId) {
            try {
                const newItem = await addFoodItem(itemName, itemType, categoryId, itemDescription);
                
                // Reload food items to update UI
                await loadFoodItems();
                
                // Clear form and close modal
                document.getElementById('item-name').value = '';
                document.getElementById('item-category').value = '';
                document.getElementById('item-description').value = '';
                modal.style.display = 'none';
                
                // Show success message
                showNotification('Продукт добавлен!', 'success');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        } else {
            showNotification('Заполните все обязательные поля', 'error');
        }
        });
    } else {
        console.error('🐀 Error: Add item button not found!');
    }
    
    // Function to populate category dropdown
    function populateCategoryDropdown() {
        const categorySelect = document.getElementById('item-category');
        categorySelect.innerHTML = '<option value="">Выберите категорию...</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.display_name;
            categorySelect.appendChild(option);
        });
    }
    
    // Function to update category dropdown based on selected type
    function updateCategoryDropdown() {
        const typeSelect = document.getElementById('item-type');
        const categorySelect = document.getElementById('item-category');
        
        typeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            categorySelect.innerHTML = '<option value="">Выберите категорию...</option>';
            
            categories
                .filter(cat => cat.type === selectedType)
                .forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.display_name;
                    categorySelect.appendChild(option);
                });
        });
    }
    
    // Function to create dynamic food section
    function createDynamicFoodSection() {
        const foodSection = document.querySelector('#food .food-categories');
        foodSection.innerHTML = '';
        
        // Group categories by type
        const safeCategories = categories.filter(cat => cat.type === 'safe');
        const dangerousCategories = categories.filter(cat => cat.type === 'dangerous');
        
        // Create safe foods section
        if (safeCategories.length > 0) {
            const safeSection = document.createElement('div');
            safeSection.className = 'food-category safe';
            safeSection.innerHTML = '<h3>✅ Безопасные продукты</h3><div class="food-grid"></div>';
            foodSection.appendChild(safeSection);
            
            safeCategories.forEach(category => {
                const categoryElement = createCategoryElement(category);
                safeSection.querySelector('.food-grid').appendChild(categoryElement);
            });
        }
        
        // Create dangerous foods section
        if (dangerousCategories.length > 0) {
            const dangerousSection = document.createElement('div');
            dangerousSection.className = 'food-category dangerous';
            dangerousSection.innerHTML = '<h3>❌ Опасные продукты</h3><div class="food-grid"></div>';
            foodSection.appendChild(dangerousSection);
            
            dangerousCategories.forEach(category => {
                const categoryElement = createCategoryElement(category);
                dangerousSection.querySelector('.food-grid').appendChild(categoryElement);
            });
        }
    }
    
    // Function to create category element
    function createCategoryElement(category) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'food-item';
        categoryDiv.dataset.categoryId = category.id;
        
        const items = foodItems[category.name]?.items || [];
        
        categoryDiv.innerHTML = `
            <h4>${category.display_name}</h4>
            <ul class="category-items-list">
                ${items.map(item => `
                    <li data-item-id="${item.id}" data-item-name="${item.name}" data-item-type="${item.type}" data-item-description="${item.description || ''}">
                        ${item.name}
                    </li>
                `).join('')}
            </ul>
        `;
        
        // Add click functionality to items for modal
        categoryDiv.querySelectorAll('li[data-item-id]').forEach(item => {
            item.addEventListener('click', function() {
                const itemId = this.dataset.itemId;
                const itemName = this.dataset.itemName;
                const itemType = this.dataset.itemType;
                const itemDescription = this.dataset.itemDescription;
                showFoodDetailsModal(itemId, itemName, itemType, itemDescription);
            });
        });
        
        return categoryDiv;
    }
    
    // Load categories and food items
    async function loadCategories() {
        categories = await fetchCategories();
        populateCategoryDropdown();
        updateCategoryDropdown();
    }
    
    async function loadFoodItems() {
        foodItems = await fetchFoodItems();
        createDynamicFoodSection();
    }
    
    // Initialize everything
    async function initializeApp() {
        await loadCategories();
        await loadFoodItems();
    }
    
    // Initialize the app
    initializeApp();
    
    // Food Details Modal functionality
    let currentItemId = null;
    
    function showFoodDetailsModal(itemId, itemName, itemType, itemDescription) {
        currentItemId = itemId;
        const modal = document.getElementById('food-details-modal');
        const modalName = document.getElementById('modal-food-name');
        const modalType = document.getElementById('modal-food-type');
        const modalDescription = document.getElementById('modal-food-description');
        
        modalName.textContent = itemName;
        modalType.textContent = itemType === 'safe' ? '✅ Безопасный' : '❌ Опасный';
        modalType.className = `food-type-badge ${itemType}`;
        modalDescription.textContent = itemDescription || 'Описание не указано';
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Re-setup event listeners to ensure they work
        setupModalEventListeners();
    }
    
    function hideFoodDetailsModal() {
        const modal = document.getElementById('food-details-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
        currentItemId = null;
    }
    
    // Modal event listeners - moved outside DOMContentLoaded to avoid conflicts
    function setupModalEventListeners() {
        const modal = document.getElementById('food-details-modal');
        const closeModalBtn = document.getElementById('close-food-modal');
        const closeModalBtn2 = document.getElementById('close-food-modal-btn');
        const deleteBtn = document.getElementById('delete-food-item-btn');
        
        // Remove existing event listeners to prevent duplicates
        if (closeModalBtn) {
            closeModalBtn.replaceWith(closeModalBtn.cloneNode(true));
        }
        if (closeModalBtn2) {
            closeModalBtn2.replaceWith(closeModalBtn2.cloneNode(true));
        }
        if (deleteBtn) {
            deleteBtn.replaceWith(deleteBtn.cloneNode(true));
        }
        
        // Get fresh references after replacement
        const freshCloseModalBtn = document.getElementById('close-food-modal');
        const freshCloseModalBtn2 = document.getElementById('close-food-modal-btn');
        const freshDeleteBtn = document.getElementById('delete-food-item-btn');
        
        // Close modal buttons
        if (freshCloseModalBtn) {
            freshCloseModalBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                hideFoodDetailsModal();
            });
        }
        
        if (freshCloseModalBtn2) {
            freshCloseModalBtn2.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                hideFoodDetailsModal();
            });
        }
        
        // Delete item button
        if (freshDeleteBtn) {
            freshDeleteBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (currentItemId) {
                    if (confirm('Вы уверены, что хотите удалить этот продукт?')) {
                        try {
                            await deleteFoodItem(currentItemId);
                            await loadFoodItems(); // Reload to update UI
                            hideFoodDetailsModal();
                            showNotification('Продукт удален', 'success');
                        } catch (error) {
                            showNotification(error.message, 'error');
                        }
                    }
                }
            });
        }
        
        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    hideFoodDetailsModal();
                }
            });
        }
    }
    
    // Setup modal event listeners after DOM is loaded
    setupModalEventListeners();
    
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
        
        // Close modal with Escape key
        if (e.key === 'Escape') {
            const modal = document.getElementById('food-details-modal');
            if (modal && modal.style.display === 'block') {
                hideFoodDetailsModal();
            }
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
    foodItemElements.forEach(item => {
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