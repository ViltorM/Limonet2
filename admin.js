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