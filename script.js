let lang = 'ua';
let translations = {};
let products = [];
let cart = [];

// Загрузка переводов
fetch('translations.js')
  .then(response => response.text())
  .then(data => {
    eval(data);
    applyTranslations();
  });

// Проверяем localStorage при загрузке
document.addEventListener('DOMContentLoaded', () => {
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
    });
});

function setLang(selectedLang) {
  lang = selectedLang;
  applyTranslations();
  renderProducts();
  renderCart();
}

function applyTranslations() {
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

function renderProducts() {
  const container = document.getElementById('products');
  container.innerHTML = '';
  products.forEach((category, catIndex) => {
    const title = document.createElement('h3');
    title.textContent = category.category;
    container.appendChild(title);
    
    const categoryContainer = document.createElement('div');
    categoryContainer.className = 'category-container';
    container.appendChild(categoryContainer);
    
    category.items.forEach((item, itemIndex) => {
      if (item.status === "hidden") return;
      
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${item.image}" alt="${item.size}">
        <h4>${item.name || item.size}</h4>
        <p>${item.price} грн</p>
        <p>${item.status === 'soon' ? 'Очікується' : ''}</p>
        <input type="number" min="1" max="20" value="1" class="quantity-input" 
               data-cat="${catIndex}" data-item="${itemIndex}">
        <button class="add-to-cart" data-cat="${catIndex}" data-item="${itemIndex}">
          Додати в кошик
        </button>
      `;
      categoryContainer.appendChild(card);
    });
  });
  
  // Добавляем обработчики для кнопок
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const catIndex = e.target.getAttribute('data-cat');
      const itemIndex = e.target.getAttribute('data-item');
      const quantityInput = e.target.previousElementSibling;
      const quantity = parseInt(quantityInput.value);
      
      addToCart(catIndex, itemIndex, quantity);
    });
  });
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
    cart.push({
      catIndex: parseInt(catIndex),
      itemIndex: parseInt(itemIndex),
      quantity: quantity,
      price: product.price,
      name: product.name || product.size,
      image: product.image
    });
  }
  
  saveCart();
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total');
  container.innerHTML = '';
  
  let total = 0;
  
  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
      <span>${item.name} (${item.quantity} шт.)</span>
      <span>${(item.price * item.quantity).toFixed(2)} грн</span>
      <button class="remove-item" data-index="${index}">✕</button>
    `;
    container.appendChild(li);
    
    total += item.price * item.quantity;
  });
  
  totalElement.textContent = total.toFixed(2);
  
  // Добавляем обработчики для кнопок удаления
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      removeFromCart(index);
    });
  });
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
document.getElementById('order-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  if (cart.length === 0) {
    alert(lang === 'ua' ? 'Кошик порожній!' : 'Корзина пуста!');
    return;
  }
  
  const formData = new FormData(this);
  const order = {
    customer: Object.fromEntries(formData),
    items: [...cart],
    total: document.getElementById('cart-total').textContent,
    date: new Date().toISOString()
  };
  
  // В реальном приложении здесь была бы отправка на сервер
  console.log('Order submitted:', order);
  
  alert(lang === 'ua' 
    ? 'Замовлення оформлено! Ми з вами зв\'яжемось.' 
    : 'Заказ оформлен! Мы с вами свяжемся.');
  
  // Очищаем корзину
  cart = [];
  saveCart();
  renderCart();
  this.reset();
});

// Для админ-панели: обновляем данные при изменении
document.addEventListener('dataUpdated', () => {
  fetch('products.json')
    .then(res => res.json())
    .then(data => {
      products = data;
      renderProducts();
    });
});