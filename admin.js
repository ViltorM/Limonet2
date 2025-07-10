// Основные переменные
let currentAdmin = null;
let categories = [];
let editingCategoryId = null;
let editingProductId = null;

// DOM элементы
const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginMessage = document.getElementById('loginMessage');
const categoriesCount = document.getElementById('categoriesCount');
const productsCount = document.getElementById('productsCount');

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем авторизацию
  checkAuth();
  
  // Загрузка данных
  loadData();
  
  // Назначаем обработчики
  document.querySelectorAll('.admin-menu li').forEach(item => {
    if (item.id !== 'logoutBtn') {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        showSection(section);
      });
    }
  });
  
  if (loginBtn) loginBtn.addEventListener('click', login);
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  
  // Категории
  document.getElementById('addCategoryBtn')?.addEventListener('click', showCategoryForm);
  document.getElementById('cancelCategoryBtn')?.addEventListener('click', hideCategoryForm);
  document.getElementById('saveCategoryBtn')?.addEventListener('click', saveCategory);
  
  // Товары
  document.getElementById('addProductBtn')?.addEventListener('click', showProductForm);
  document.getElementById('cancelProductBtn')?.addEventListener('click', hideProductForm);
  document.getElementById('saveProductBtn')?.addEventListener('click', saveProduct);
  
  // Заказы
  document.getElementById('applyFilterBtn')?.addEventListener('click', applyOrderFilter);
  
  // Дизайн
  document.getElementById('saveCssBtn')?.addEventListener('click', saveCss);
  
  // Настройки
  document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
});

// Проверка авторизации
function checkAuth() {
  const savedAdmin = localStorage.getItem('limonet_admin');
  if (savedAdmin) {
    currentAdmin = JSON.parse(savedAdmin);
    loginSection.style.display = 'none';
    adminPanel.style.display = 'flex';
  }
}

// Загрузка данных
function loadData() {
  // Загрузка категорий и товаров
  fetch('products.json')
    .then(response => response.json())
    .then(data => {
      categories = data;
      updateCounts();
      renderCategories();
      renderProducts();
    })
    .catch(error => console.error('Error loading products:', error));
  
  // Загрузка CSS
  fetch('styles.css')
    .then(response => response.text())
    .then(css => {
      document.getElementById('cssContent').value = css;
    });
  
  // Загрузка заказов
  renderOrders();
}

// Обновление счетчиков
function updateCounts() {
  categoriesCount.textContent = categories.length;
  
  let totalProducts = 0;
  categories.forEach(category => {
    totalProducts += category.items.length;
  });
  productsCount.textContent = totalProducts;
}

// Показать раздел
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.querySelectorAll('.admin-menu li').forEach(item => {
    item.classList.remove('active');
  });
  
  document.getElementById(`${sectionId}Section`).classList.add('active');
  document.querySelector(`.admin-menu li[data-section="${sectionId}"]`).classList.add('active');
  
  // Загружаем заказы при переходе в раздел
  if (sectionId === 'orders') {
    renderOrders();
  }
}

// Авторизация
function login() {
  const login = document.getElementById('adminLogin').value;
  const password = document.getElementById('adminPassword').value;
  
  if (login === 'admin' && password === 'admin') {
    currentAdmin = { login };
    localStorage.setItem('limonet_admin', JSON.stringify(currentAdmin));
    loginSection.style.display = 'none';
    adminPanel.style.display = 'flex';
    showSection('dashboard');
  } else {
    loginMessage.textContent = 'Невірний логін або пароль';
  }
}

// Выход
function logout() {
  localStorage.removeItem('limonet_admin');
  location.reload();
}

// ===== Категории =====
function showCategoryForm() {
  document.getElementById('categoryForm').style.display = 'block';
  editingCategoryId = null;
  document.getElementById('categoryName').value = '';
}

function hideCategoryForm() {
  document.getElementById('categoryForm').style.display = 'none';
}

function saveCategory() {
  const name = document.getElementById('categoryName').value.trim();
  
  if (!name) {
    alert('Введіть назву категорії');
    return;
  }
  
  if (editingCategoryId === null) {
    // Новая категория
    categories.push({
      category: name,
      items: []
    });
  } else {
    // Редактирование существующей
    categories[editingCategoryId].category = name;
  }
  
  saveData();
  hideCategoryForm();
  renderCategories();
}

function renderCategories() {
  const container = document.getElementById('categoriesList');
  container.innerHTML = '';
  
  categories.forEach((category, index) => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <h3>${category.category}</h3>
      <p>Товарів: ${category.items.length}</p>
      <div class="actions">
        <button class="btn edit-category" data-id="${index}">Редагувати</button>
        <button class="btn delete-category" data-id="${index}" style="background: #e74c3c;">Видалити</button>
      </div>
    `;
    container.appendChild(card);
  });
  
  // Назначаем обработчики
  document.querySelectorAll('.edit-category').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      editCategory(id);
    });
  });
  
  document.querySelectorAll('.delete-category').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      deleteCategory(id);
    });
  });
}

function editCategory(id) {
  editingCategoryId = id;
  document.getElementById('categoryName').value = categories[id].category;
  document.getElementById('categoryForm').style.display = 'block';
}

function deleteCategory(id) {
  if (confirm('Видалити цю категорію? Всі товари в ній також будуть видалені.')) {
    categories.splice(id, 1);
    saveData();
    renderCategories();
  }
}

// ===== Товары =====
function showProductForm() {
  // Заполняем выпадающий список категорий
  const categorySelect = document.getElementById('productCategory');
  categorySelect.innerHTML = '';
  
  categories.forEach((category, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = category.category;
    categorySelect.appendChild(option);
  });
  
  document.getElementById('productForm').style.display = 'block';
  editingProductId = null;
  
  // Сброс значений
  document.getElementById('productName').value = '';
  document.getElementById('productSize').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productImage').value = '';
  document.getElementById('productStatus').value = 'available';
}

function hideProductForm() {
  document.getElementById('productForm').style.display = 'none';
}

function saveProduct() {
  const categoryId = document.getElementById('productCategory').value;
  const name = document.getElementById('productName').value.trim();
  const size = document.getElementById('productSize').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const image = document.getElementById('productImage').value.trim();
  const status = document.getElementById('productStatus').value;
  
  if (!name || !size || !price || !image) {
    alert('Заповніть всі обов\'язкові поля');
    return;
  }
  
  const productData = {
    size,
    price,
    image,
    status,
    name
  };
  
  if (editingProductId === null) {
    // Новый товар
    categories[categoryId].items.push(productData);
  } else {
    // Редактирование существующего товара
    const [catId, prodId] = editingProductId.split('-');
    categories[catId].items[prodId] = productData;
  }
  
  saveData();
  hideProductForm();
  renderProducts();
}

function renderProducts() {
  const container = document.getElementById('productsList');
  container.innerHTML = '';
  
  categories.forEach((category, catIndex) => {
    category.items.forEach((item, prodIndex) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <h3>${item.name || item.size}</h3>
        <p><strong>Категорія:</strong> ${category.category}</p>
        <p><strong>Розмір:</strong> ${item.size}</p>
        <p><strong>Ціна:</strong> ${item.price} грн</p>
        <p><strong>Статус:</strong> ${getStatusText(item.status)}</p>
        <div class="actions">
          <button class="btn edit-product" data-id="${catIndex}-${prodIndex}">Редагувати</button>
          <button class="btn delete-product" data-id="${catIndex}-${prodIndex}" style="background: #e74c3c;">Видалити</button>
        </div>
      `;
      container.appendChild(card);
    });
  });
  
  // Назначаем обработчики
  document.querySelectorAll('.edit-product').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      editProduct(id);
    });
  });
  
  document.querySelectorAll('.delete-product').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      deleteProduct(id);
    });
  });
}

function getStatusText(status) {
  switch(status) {
    case 'available': return 'Доступно';
    case 'soon': return 'Очікується';
    case 'hidden': return 'Приховано';
    default: return status;
  }
}

function editProduct(id) {
  editingProductId = id;
  const [catId, prodId] = id.split('-');
  const product = categories[catId].items[prodId];
  
  // Заполняем выпадающий список категорий
  const categorySelect = document.getElementById('productCategory');
  categorySelect.innerHTML = '';
  
  categories.forEach((category, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = category.category;
    option.selected = (index == catId);
    categorySelect.appendChild(option);
  });
  
  // Заполняем поля
  document.getElementById('productName').value = product.name || '';
  document.getElementById('productSize').value = product.size;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productImage').value = product.image;
  document.getElementById('productStatus').value = product.status;
  
  document.getElementById('productForm').style.display = 'block';
}

function deleteProduct(id) {
  if (confirm('Видалити цей товар?')) {
    const [catId, prodId] = id.split('-');
    categories[catId].items.splice(prodId, 1);
    saveData();
    renderProducts();
  }
}

// ===== Заказы =====
function loadOrders() {
  return JSON.parse(localStorage.getItem('limonet_orders')) || [];
}

function applyOrderFilter() {
  const filter = document.getElementById('orderStatusFilter').value;
  renderOrders(filter);
}

function renderOrders(filter = 'all') {
  const container = document.getElementById('ordersList');
  const orders = loadOrders();
  
  if (orders.length === 0) {
    container.innerHTML = '<p>Немає замовлень</p>';
    return;
  }
  
  let filteredOrders = orders;
  if (filter !== 'all') {
    filteredOrders = orders.filter(order => order.status === filter);
  }
  
  // Сортируем по дате (новые сверху)
  filteredOrders.sort((a, b) => b.id - a.id);
  
  container.innerHTML = '';
  
  filteredOrders.forEach(order => {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-card';
    orderElement.innerHTML = `
      <div class="order-header">
        <h3>Замовлення #${order.id}</h3>
        <span class="order-status ${order.status}">${getOrderStatusText(order.status)}</span>
        <span class="order-date">${order.date}</span>
      </div>
      <div class="order-summary">
        <p><strong>Клієнт:</strong> ${order.customer.fio}</p>
        <p><strong>Телефон:</strong> ${order.customer.phone}</p>
        <p><strong>Сума:</strong> ${order.total} грн</p>
        <p><strong>Оплата:</strong> ${getPaymentMethod(order.customer.payment)}</p>
      </div>
      <button class="btn view-order-details" data-id="${order.id}">Деталі</button>
    `;
    container.appendChild(orderElement);
  });
  
  // Добавляем обработчики для кнопок "Детали"
  document.querySelectorAll('.view-order-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const orderId = e.target.getAttribute('data-id');
      viewOrderDetails(orderId);
    });
  });
}

function getOrderStatusText(status) {
  switch(status) {
    case 'new': return 'Новий';
    case 'processing': return 'В обробці';
    case 'completed': return 'Завершено';
    case 'cancelled': return 'Скасовано';
    default: return status;
  }
}

function getPaymentMethod(payment) {
  if (payment === 'card') return 'На картку';
  if (payment === 'cod') return 'Накладений платіж';
  return payment;
}

function viewOrderDetails(orderId) {
  const orders = loadOrders();
  const order = orders.find(o => o.id == orderId);
  
  if (!order) {
    alert('Замовлення не знайдено');
    return;
  }
  
  // Формируем HTML с деталями заказа
  let itemsHtml = '';
  order.items.forEach(item => {
    itemsHtml += `
      <tr>
        <td><img src="${item.image}" alt="${item.name}" style="width:50px;"></td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.price} грн</td>
        <td>${item.price * item.quantity} грн</td>
      </tr>
    `;
  });
  
  const detailsHtml = `
    <div class="order-details">
      <h2>Замовлення #${order.id}</h2>
      <p><strong>Статус:</strong> 
        <select id="orderStatus" class="form-control">
          <option value="new" ${order.status === 'new' ? 'selected' : ''}>Новий</option>
          <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>В обробці</option>
          <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Завершено</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Скасовано</option>
        </select>
      </p>
      
      <div class="customer-info">
        <h3>Інформація про клієнта</h3>
        <p><strong>ПІБ:</strong> ${order.customer.fio}</p>
        <p><strong>Телефон:</strong> ${order.customer.phone}</p>
        <p><strong>Місто:</strong> ${order.customer.city}</p>
        <p><strong>Відділення пошти:</strong> ${order.customer.post}</p>
        <p><strong>Спосіб оплати:</strong> ${getPaymentMethod(order.customer.payment)}</p>
        <p><strong>Коментар:</strong> ${order.customer.comment || '-'}</p>
      </div>
      
      <div class="order-items">
        <h3>Товари</h3>
        <table>
          <thead>
            <tr>
              <th>Фото</th>
              <th>Назва</th>
              <th>Кількість</th>
              <th>Ціна</th>
              <th>Сума</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align: right;"><strong>Загальна сума:</strong></td>
              <td><strong>${order.total} грн</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div class="order-actions">
        <button id="saveOrderBtn" class="btn">Зберегти зміни</button>
        <button id="closeOrderDetails" class="btn" style="background: #95a5a6;">Закрити</button>
      </div>
    </div>
  `;
  
  // Создаем модальное окно
  const modal = document.createElement('div');
  modal.className = 'order-modal';
  modal.innerHTML = detailsHtml;
  document.body.appendChild(modal);
  
  // Обработчики кнопок
  document.getElementById('saveOrderBtn').addEventListener('click', () => {
    saveOrderStatus(orderId, document.getElementById('orderStatus').value);
  });
  
  document.getElementById('closeOrderDetails').addEventListener('click', () => {
    modal.remove();
  });
}

function saveOrderStatus(orderId, newStatus) {
  const orders = loadOrders();
  const orderIndex = orders.findIndex(o => o.id == orderId);
  
  if (orderIndex !== -1) {
    orders[orderIndex].status = newStatus;
    localStorage.setItem('limonet_orders', JSON.stringify(orders));
    
    // Обновляем список заказов
    const filter = document.getElementById('orderStatusFilter').value;
    renderOrders(filter);
    
    // Закрываем модальное окно
    document.querySelector('.order-modal').remove();
    
    alert('Статус замовлення оновлено!');
  }
}

// ===== Дизайн =====
function saveCss() {
  const cssContent = document.getElementById('cssContent').value;
  
  // Сохраняем CSS в localStorage
  localStorage.setItem('limonet_css', cssContent);
  
  // Обновляем CSS на сайте
  const styleTag = document.createElement('style');
  styleTag.textContent = cssContent;
  
  // Удаляем старый стиль, если есть
  const oldStyle = document.getElementById('dynamic-css');
  if (oldStyle) oldStyle.remove();
  
  styleTag.id = 'dynamic-css';
  document.head.appendChild(styleTag);
  
  alert('CSS успішно збережено!');
}

// ===== Настройки =====
function saveSettings() {
  const newLogin = document.getElementById('adminUsername').value.trim();
  const newPassword = document.getElementById('adminNewPassword').value;
  const confirmPassword = document.getElementById('adminConfirmPassword').value;
  
  if (newLogin && newPassword) {
    if (newPassword !== confirmPassword) {
      alert('Паролі не співпадають');
      return;
    }
    
    currentAdmin.login = newLogin;
    localStorage.setItem('limonet_admin', JSON.stringify(currentAdmin));
    alert('Дані успішно оновлено!');
  }
}

// Сохранение данных
function saveData() {
  // Сохраняем в localStorage
  localStorage.setItem('limonet_products', JSON.stringify(categories));
  
  // Обновляем счетчики
  updateCounts();
  
  // Обновляем данные на сайте
  const event = new Event('dataUpdated');
  document.dispatchEvent(event);
}
