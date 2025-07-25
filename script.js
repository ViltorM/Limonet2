let lang = 'ua';
let translations = {};
let products = [];
let cart = [];
let currentView = 'grid'; // grid, list, horizontal

// Загрузка переводов
fetch('translations.js')
  .then(response => response.text())
  .then(data => {
    eval(data);
    applyTranslations();
  })
  .catch(error => console.error('Error loading translations:', error));

// Проверяем localStorage при загрузке
document.addEventListener('DOMContentLoaded', () => {
  // Восстанавливаем сохранённый язык
  const savedLang = localStorage.getItem('limonet_lang');
  if (savedLang) {
    lang = savedLang;
    // Обновляем активную кнопку языка
    document.querySelectorAll('.lang-switcher button').forEach(btn => {
      btn.classList.remove('active');
      if (btn.textContent === lang.toUpperCase()) {
        btn.classList.add('active');
      }
    });
  }
  
  const savedCart = localStorage.getItem('limonet_cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    renderCart();
  }
  
  const savedCss = localStorage.getItem('limonet_css');
  if (savedCss) {
    const styleTag = document.createElement('style');
    styleTag.textContent = savedCss;
    styleTag.id = 'dynamic-css';
    document.head.appendChild(styleTag);
  }

  // Загрузка продуктов
  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      products = data;
      renderProducts();
      initFeaturedBanner();
    })
    .catch(error => console.error('Error loading products:', error));
    
  // Загрузка настроек вида
  const savedView = localStorage.getItem('product_view');
  if (savedView) {
    currentView = savedView;
    document.querySelectorAll('.view-option').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-view') === currentView) {
        btn.classList.add('active');
      }
    });
  }
  
  // Инициализация переключателей вида
  document.querySelectorAll('.view-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.getAttribute('data-view');
      localStorage.setItem('product_view', currentView);
      renderProducts();
    });
  });

  // Добавляем иконки для полей формы
  const addIcon = (selector, iconCode) => {
    const input = document.querySelector(selector);
    if (input) {
      const wrapper = document.createElement('div');
      wrapper.className = 'input-with-icon';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      
      wrapper.insertAdjacentHTML('afterbegin', 
        `<span class="input-icon">${iconCode}</span>`);
    }
  };
  
  addIcon('input[name="fio"]', '👤');
  addIcon('input[name="phone"]', '📱');
  addIcon('input[name="city"]', '🏙️');
  addIcon('input[name="post"]', '📮');
  
  // Решение проблемы с выбором оплаты
  const paymentSelect = document.querySelector('select[name="payment"]');
  
  // Инициализация: если ничего не выбрано, показываем placeholder
  if (!paymentSelect.value) {
    paymentSelect.selectedIndex = 0;
  }
  
  // При изменении выбора
  paymentSelect.addEventListener('change', function() {
    if (this.value) {
      const placeholderOption = this.querySelector('option[disabled]');
      if (placeholderOption) {
        placeholderOption.removeAttribute('selected');
      }
    }
  });
  
  // При отправке формы
  document.getElementById('order-form').addEventListener('submit', function() {
    if (paymentSelect.value) {
      const placeholderOption = paymentSelect.querySelector('option[disabled]');
      if (placeholderOption) {
        placeholderOption.removeAttribute('selected');
      }
    }
  });
});

function setLang(selectedLang) {
  lang = selectedLang;
  // Сохраняем выбранный язык
  localStorage.setItem('limonet_lang', lang);
  
  // Обновляем активные кнопки
  document.querySelectorAll('.lang-switcher button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent === lang.toUpperCase()) {
      btn.classList.add('active');
    }
  });
  
  applyTranslations();
  renderProducts();
  renderCart(); // Обязательно перерисовываем корзину при смене языка
}

function applyTranslations() {
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  
  // Обновляем плейсхолдеры
  document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
    const key = el.getAttribute('data-translate-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });
  
  // Обновляем заголовки переключателей видов
  document.querySelectorAll('.view-option').forEach(btn => {
    const viewType = btn.getAttribute('data-view');
    const translationKey = `${viewType}_view`;
    if (translations[lang] && translations[lang][translationKey]) {
      btn.setAttribute('title', translations[lang][translationKey]);
      btn.setAttribute('aria-label', translations[lang][translationKey]);
    }
  });
}

// Баннер рекомендуемых товаров
function initFeaturedBanner() {
  const featuredSettings = JSON.parse(localStorage.getItem('featured_settings')) || {
    enabled: false,
    products: [],
    autoRotate: true
  };
  
  if (!featuredSettings.enabled || featuredSettings.products.length === 0) {
    document.getElementById('featured-products').style.display = 'none';
    return;
  }
  
  document.getElementById('featured-products').style.display = 'block';
  const container = document.querySelector('.featured-items');
  container.innerHTML = '';
  
  featuredSettings.products.forEach(id => {
    const [catIndex, itemIndex] = id.split('-');
    const product = products[catIndex]?.items[itemIndex];
    if (!product) return;
    
    const div = document.createElement('div');
    div.className = 'featured-item';
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name[lang] || product.name}">
      <h4>${product.name[lang] || product.name}</h4>
      <p>${product.price} грн</p>
    `;
    container.appendChild(div);
  });
  
  // Навигация
  document.getElementById('prev-featured').addEventListener('click', () => {
    document.querySelector('.featured-items').scrollBy({ left: -200, behavior: 'smooth' });
  });
  
  document.getElementById('next-featured').addEventListener('click', () => {
    document.querySelector('.featured-items').scrollBy({ left: 200, behavior: 'smooth' });
  });
}

function renderProducts() {
  const container = document.getElementById('products');
  if (!container) {
    console.error('Products container not found');
    return;
  }
  container.innerHTML = '';
  
  products.forEach((category, catIndex) => {
    const categoryWrapper = document.createElement('div');
    categoryWrapper.className = 'category-container';
    container.appendChild(categoryWrapper);
    
    // Получаем первый товар для изображения и материала
    const firstItem = category.items.find(item => item.status !== "hidden") || category.items[0];
    
    // Заголовок категории с переключателем
    const header = document.createElement('div');
    header.className = 'category-header';
    header.setAttribute('data-cat', catIndex);
    
    const title = document.createElement('h3');
    title.className = 'category-title';
    title.textContent = category.category[lang] || category.category;
    
    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'toggle-icon';
    toggleIcon.innerHTML = '▼';
    
    header.appendChild(title);
    header.appendChild(toggleIcon);
    categoryWrapper.appendChild(header);
    
    // Контент категории (свёрнутое состояние)
    const content = document.createElement('div');
    content.className = 'category-content';
    
    // Добавляем внешние размеры для футляров
    const sizeHtml = firstItem.externalSize ? `
      <p class="category-size">
        ${translations[lang]?.external_size || 'External size'}: ${firstItem.externalSize}
      </p>
    ` : '';
    
    content.innerHTML = `
      <img src="${firstItem.image}" alt="${category.category[lang] || category.category}" class="category-image">
      <div class="category-info">
        <p class="category-material">
          ${translations[lang]?.material || 'Material'}: 
          ${firstItem.material?.[lang] || firstItem.material || ''}
        </p>
        ${sizeHtml}
      </div>
    `;
    
    categoryWrapper.appendChild(content);
    
    // Контейнер для товаров
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'products-group';
    itemsContainer.style.display = 'none'; // По умолчанию скрыт
    categoryWrapper.appendChild(itemsContainer);
    
    // Обработчик клика по заголовку
    header.addEventListener('click', () => {
      const isExpanded = itemsContainer.style.display === 'block';
      itemsContainer.style.display = isExpanded ? 'none' : 'block';
      categoryWrapper.classList.toggle('expanded', !isExpanded);
      
      // Если разворачиваем - рендерим товары
      if (!isExpanded && itemsContainer.children.length === 0) {
        renderCategoryItems(category, catIndex, itemsContainer);
      }
    });
  });
}

function renderCategoryItems(category, catIndex, container) {
  container.innerHTML = '';
  
  const productsContainer = document.createElement('div');
  productsContainer.className = `products-container ${currentView}-view`;
  container.appendChild(productsContainer);
  
  category.items.forEach((item, itemIndex) => {
    if (item.status === "hidden") return;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const name = item.name[lang] || item.name;
    const description = item.description?.[lang] || item.description || '';
    
    // Определение класса статуса
    let statusClass = '';
    let statusText = '';
    
    if (item.status === 'in_stock') {
      statusClass = 'in-stock';
      statusText = translations[lang]?.in_stock || 'In stock';
    } else if (item.status === 'soon') {
      statusClass = 'soon';
      statusText = translations[lang]?.soon || 'Coming soon';
    } else if (item.status === 'out_of_stock') {
      statusClass = 'out-of-stock';
      statusText = translations[lang]?.out_of_stock || 'Out of stock';
    }
    
    // Проверяем, доступен ли товар для заказа
    const isDisabled = item.status === 'out_of_stock';
    
    // Добавляем отображение размеров
    const externalSize = item.externalSize ? `
      <div class="size-item">
        <span>${translations[lang]?.external_size || 'External size'}: ${item.externalSize}</span>
      </div>
    ` : '';
    
    const internalSize = item.internalSize ? `
      <div class="size-item">
        <span>${translations[lang]?.internal_size || 'Internal size'}: ${item.internalSize}</span>
      </div>
    ` : '';
    
    const sizes = (externalSize || internalSize) ? `
      <div class="product-sizes">
        ${externalSize}
        ${internalSize}
      </div>
    ` : '';

    // Добавляем отображение материала
    const material = item.material?.[lang] || item.material || '';
    const materialHtml = material ? `
      <div class="product-material">
        <span class="material-label">${translations[lang]?.material || 'Material'}:</span>
        <span class="material-value">${material}</span>
      </div>
    ` : '';

    // Генерация HTML в зависимости от режима
    if (currentView === 'list') {
      card.innerHTML = `
        <img src="${item.image}" alt="${name}">
        <div class="product-info">
          <div class="product-group">
            <h4>${name}</h4>
            <div class="description">${description}</div>
          </div>
          ${sizes}
          ${materialHtml}
          <div class="control-group">
            ${statusText ? `<div class="status ${statusClass}">${statusText}</div>` : ''}
            <div class="product-price">${item.price} грн</div>
          </div>
        </div>
        <div class="product-controls">
          <div class="quantity-controls">
            <button class="quantity-btn minus" data-cat="${catIndex}" data-item="${itemIndex}" 
                    ${isDisabled ? 'disabled' : ''}>-</button>
            <input type="number" min="1" value="1" class="quantity-input" 
                   data-cat="${catIndex}" data-item="${itemIndex}" 
                   ${isDisabled ? 'disabled' : ''}>
            <button class="quantity-btn plus" data-cat="${catIndex}" data-item="${itemIndex}" 
                    ${isDisabled ? 'disabled' : ''}>+</button>
          </div>
          <button class="add-to-cart btn-primary" data-cat="${catIndex}" data-item="${itemIndex}" 
                  ${isDisabled ? 'disabled' : ''}>
            ${translations[lang]?.add_to_cart || 'Add to cart'}
          </button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <img src="${item.image}" alt="${name}">
        
        <div class="product-group">
          <h4>${name}</h4>
          <div class="description">${description}</div>
        </div>
        
        ${sizes}
        ${materialHtml}
        
        <div class="control-group">
          ${statusText ? `<div class="status ${statusClass}">${statusText}</div>` : ''}
          <div class="product-price">${item.price} грн</div>
          
          <div class="quantity-controls">
            <button class="quantity-btn minus" data-cat="${catIndex}" data-item="${itemIndex}" 
                    ${isDisabled ? 'disabled' : ''}>-</button>
            <input type="number" min="1" value="1" class="quantity-input" 
                   data-cat="${catIndex}" data-item="${itemIndex}" 
                   ${isDisabled ? 'disabled' : ''}>
            <button class="quantity-btn plus" data-cat="${catIndex}" data-item="${itemIndex}" 
                    ${isDisabled ? 'disabled' : ''}>+</button>
          </div>
          
          <button class="add-to-cart btn-primary" data-cat="${catIndex}" data-item="${itemIndex}" 
                  ${isDisabled ? 'disabled' : ''}>
            ${translations[lang]?.add_to_cart || 'Add to cart'}
          </button>
        </div>
      `;
    }
    
    productsContainer.appendChild(card);
  });
  
  // Добавляем обработчики
  setTimeout(() => {
    document.querySelectorAll('.add-to-cart:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const catIndex = e.target.getAttribute('data-cat');
        const itemIndex = e.target.getAttribute('data-item');
        const quantityInput = e.target.closest('.product-card').querySelector('.quantity-input');
        const quantity = parseInt(quantityInput.value);
        
        addToCart(catIndex, itemIndex, quantity);
      });
    });
    
    // Обработчики кнопок +/-
    document.querySelectorAll('.quantity-btn.plus:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const input = e.target.parentElement.querySelector('.quantity-input');
        input.value = parseInt(input.value) + 1;
      });
    });
    
    document.querySelectorAll('.quantity-btn.minus:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const input = e.target.parentElement.querySelector('.quantity-input');
        if (input.value > 1) {
          input.value = parseInt(input.value) - 1;
        }
      });
    });
  }, 100);
}

function addToCart(catIndex, itemIndex, quantity) {
  const product = products[catIndex].items[itemIndex];
  
  // Проверяем, есть ли уже товар в корзине
  const existingItem = cart.find(item => 
    item.catIndex == catIndex && item.itemIndex == itemIndex
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    // Сохраняем идентификаторы товара, а не название
    cart.push({
      catIndex: parseInt(catIndex),
      itemIndex: parseInt(itemIndex),
      quantity: quantity,
      price: product.price,
      // Не сохраняем название, будем брать его из актуального источника
      image: product.image,
      externalSize: product.externalSize,
      internalSize: product.internalSize,
      material: product.material?.[lang] || product.material || ''
    });
  }
  
  saveCart();
  renderCart();
  
  // Анимация добавления
  const btn = document.querySelector(`.add-to-cart[data-cat="${catIndex}"][data-item="${itemIndex}"]`);
  if (btn) {
    btn.classList.add('animate');
    setTimeout(() => btn.classList.remove('animate'), 500);
  }
}

// ФУНКЦИЯ ДЛЯ ОТОБРАЖЕНИЯ КОРЗИНЫ С ФИКСОМ ПЕРЕВОДА
function renderCart() {
  const container = document.getElementById('cart-items');
  if (!container) return;
  
  const totalElement = document.getElementById('cart-total');
  if (!totalElement) return;
  
  container.innerHTML = '';
  
  let total = 0;
  
  // Берем перевод для "Внешние размеры" из объекта translations для текущего языка
  const externalSizeLabel = translations[lang]?.external_size || 'Зовнішні розміри';
  
  cart.forEach((item, index) => {
    // Получаем актуальную информацию о товаре
    const product = products[item.catIndex]?.items[item.itemIndex];
    if (!product) return;
    
    // Берем название на текущем языке
    const productName = product.name[lang] || product.name;
    
    const li = document.createElement('li');
    li.className = 'cart-item';
    
    // Добавляем отображение внешних размеров
    const externalSizeHtml = item.externalSize ? 
      `<div class="item-size">${externalSizeLabel}: ${item.externalSize}</div>` : '';
    
    li.innerHTML = `
      <img src="${item.image}" alt="${productName}">
      <div class="item-info">
        <div class="item-name">${productName}</div>
        ${externalSizeHtml}
        <div class="item-price">${item.price} грн × ${item.quantity}</div>
      </div>
      <div class="item-controls">
        <div class="quantity-controls">
          <button class="quantity-btn cart-minus" data-index="${index}">-</button>
          <input type="number" min="1" value="${item.quantity}" class="quantity-input cart-quantity" data-index="${index}">
          <button class="quantity-btn cart-plus" data-index="${index}">+</button>
        </div>
        <button class="remove-item" data-index="${index}">✕</button>
      </div>
    `;
    container.appendChild(li);
    
    total += item.price * item.quantity;
  });
  
  totalElement.textContent = total.toFixed(2);
  
  // Добавляем обработчики
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      removeFromCart(index);
    });
  });
  
  document.querySelectorAll('.cart-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      updateCartItemQuantity(index, -1);
    });
  });
  
  document.querySelectorAll('.cart-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      updateCartItemQuantity(index, 1);
    });
  });
  
  document.querySelectorAll('.cart-quantity').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = e.target.getAttribute('data-index');
      const value = parseInt(e.target.value);
      if (value > 0) {
        cart[index].quantity = value;
        saveCart();
        renderCart();
      }
    });
  });
}

function updateCartItemQuantity(index, change) {
  const newQuantity = cart[index].quantity + change;
  if (newQuantity > 0) {
    cart[index].quantity = newQuantity;
    saveCart();
    renderCart();
  }
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem('limonet_cart', JSON.stringify(cart));
}

// Обработка формы заказа
document.getElementById('order-form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  if (cart.length === 0) {
    alert(lang === 'ua' ? 'Кошик порожній!' : 'Корзина пуста!');
    return;
  }
  
  const formData = new FormData(this);
  const order = {
    id: Date.now(),
    customer: Object.fromEntries(formData),
    items: [...cart],
    total: document.getElementById('cart-total').textContent,
    date: new Date().toLocaleString('ua-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    status: 'new'
  };
  
  // Сохраняем заказ
  saveOrder(order);
  
  alert(lang === 'ua' 
    ? 'Замовлення оформлено! Ми з вами зв\'яжемось.' 
    : 'Заказ оформлен! Мы с вами свяжемся.');
  
  // Очищаем корзину
  cart = [];
  saveCart();
  renderCart();
  this.reset();
});

function saveOrder(order) {
  const orders = JSON.parse(localStorage.getItem('limonet_orders')) || [];
  orders.push(order);
  localStorage.setItem('limonet_orders', JSON.stringify(orders));
  const event = new Event('newOrder');
  document.dispatchEvent(event);
}

// Для админ-панели: обновляем данные при изменении
document.addEventListener('dataUpdated', () => {
  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      products = data;
      renderProducts();
      initFeaturedBanner();
    });
});
