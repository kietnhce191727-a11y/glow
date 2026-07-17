// =========================================================================
// 1. CẤU HÌNH HỆ THỐNG & DANH MỤC DỮ LIỆU
// =========================================================================
const categories = ["Trang Điểm", "Chăm Sóc Da", "Chăm Sóc Cơ Thể", "Chăm Sóc Tóc", "Tools & Brushes", "Phụ Kiện", "Dành Cho Nam"];
const brands = ["COCOON", "COLORKEY", "GLAMRR Q", "MD CARE", "LA ROCHE POSAY", "DOVE"];
const subTags = ["Mặt Nạ", "Son Môi", "Tẩy Trang", "Chống Nắng"];

let products = [];
let idCounter = 1;

// =========================================================================
// 2. KHỞI TẠO KHO DỮ LIỆU CHUẨN XÁO TRỘN XEN KẼ THƯƠNG HIỆU
// =========================================================================
brands.forEach(brand => {
    for (let i = 1; i <= 20; i++) { 
        let randomCat = categories[(i + brand.length) % categories.length];
        let randomSub = subTags[(i * i) % subTags.length];
        let mockPrice = 110000 + (i * 18000) % 800000;

        let brandFileName = brand.toLowerCase().replace(/\s+/g, '-');
        let imagePath = `img/product/${brandFileName}-${i}.webp`; 

        products.push({
            id: idCounter++,
            name: randomCat + " - " + brand + " - Thiết kế cao cấp mẫu số " + i,
            price: mockPrice,
            oldPrice: mockPrice + 75000,
            brand: brand,
            category: randomCat,
            subTag: randomSub,
            image: imagePath, 
            reviews: [
                { author: "Trần Tấn Cường", stars: 5, date: "10/10/2026", text: "Sản phẩm dùng rất thích, mùi thơm dễ chịu và lành tính." }
            ]
        });
    }
});

// Trộn đều sản phẩm ngẫu nhiên trên trang chủ
function shuffleProducts(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
shuffleProducts(products); 

let currentFilteredProducts = []; 
let currentPage = 1;
const itemsPerPage = 20; 
let selectedCategoryGlobal = "Trang Điểm"; 

let cart = [];
let wishlist = [];
let currentDetailId = 1;
let selectedReviewStars = 5;

let isLoggedIn = false;
let currentUser = null;

// HÀM DÒ ĐUÔI ẢNH TỰ ĐỘNG THÔNG MINH
function handleImageFallback(imgElement, brand, itemNumber) {
    const brandFileName = brand.toLowerCase().replace(/\s+/g, '-');
    const extensions = ['webp', 'avif', 'png', 'jpg', 'jpeg']; 
    const currentSrc = imgElement.src;
    
    let currentExt = '';
    for (let ext of extensions) {
        if (currentSrc.endsWith('.' + ext)) {
            currentExt = ext;
            break;
        }
    }
    
    const currentIndex = extensions.indexOf(currentExt);
    
    if (currentIndex !== -1 && currentIndex < extensions.length - 1) {
        const nextExt = extensions[currentIndex + 1];
        imgElement.src = "img/product/" + brandFileName + "-" + itemNumber + "." + nextExt;
    } else {
        imgElement.onerror = null;
        imgElement.src = "https://placehold.co/300x300/f8c8dc/2c2c2c?text=" + brand + "+No." + itemNumber;
    }
}

// =========================================================================
// 3. ĐIỀU HƯỚNG TRANG (NAVIGATION)
// =========================================================================
function navigateTo(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
    
    if (pageId === 'cart-page') renderCartPage();
    if (pageId === 'wishlist-page') renderWishlistPage();
    if (pageId === 'checkout-page') renderCheckout();
}

function backToHomeDirect() {
    document.querySelectorAll('#main-menu li').forEach(li => li.classList.remove('active-menu'));
    document.getElementById('menu-home').classList.add('active-menu');
    document.getElementById('global-search').value = '';
    const container = document.getElementById('search-suggestions');
    if (container) container.classList.add('d-none');
    buildHomePage();
    navigateTo('home-page');
}

// =========================================================================
// 4. RENDER GIAO DIỆN SẢN PHẨM (PRODUCT CARDS)
// =========================================================================
function createProductCard(p) {
    const inWishlist = wishlist.includes(p.id);
    const match = p.name.match(/mẫu số (\d+)/);
    const itemNumber = match ? parseInt(match[1]) : 1;

    return `
        <div class="col">
            <div class="product-card">
                <div class="img-box" onclick="openDetail(${p.id})">
                    <img src="${p.image}" alt="${p.name}" class="product-img" 
                         onerror="handleImageFallback(this, '${p.brand}', ${itemNumber})">
                </div>
                <div class="brand-name">${p.brand}</div>
                <div class="product-name" onclick="openDetail(${p.id})">${p.name}</div>
                
                <div class="card-footer-box">
                    <div class="price-box">
                        <span class="current-price fw-bold">${p.price.toLocaleString()}đ</span>
                        <span class="old-price">${p.oldPrice.toLocaleString()}đ</span>
                    </div>
                    <div class="card-actions">
                        <button class="icon-btn ${inWishlist ? 'active-heart' : ''}" onclick="event.stopPropagation(); handleWishlistClick(${p.id})">
                            <i class="fa-${inWishlist ? 'solid' : 'regular'} fa-heart"></i>
                        </button>
                        <button class="icon-btn" onclick="event.stopPropagation(); handleCartClick(${p.id})">
                            <i class="fa-solid fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildHomePage() {
    document.getElementById('flash-sale-grid').innerHTML = products.slice(0, 4).map(createProductCard).join('');
    document.getElementById('bestseller-grid').innerHTML = products.slice(4, 12).map(createProductCard).join('');
}

function filterSubCatalog(tabName) {
    document.querySelectorAll('.sub-categories .sub-cat-btn').forEach(btn => btn.classList.remove('active-sub'));
    if(event && event.currentTarget) event.currentTarget.classList.add('active-sub');
    
    let filtered = [];
    if (tabName === "ALL") {
        filtered = products.slice(4, 12);
    } else if (tabName === "Mặt Nạ" || tabName === "Son Môi") {
        filtered = products.filter(p => p.subTag === tabName);
    } else {
        filtered = products.filter(p => p.category.toLowerCase() === tabName.toLowerCase());
    }
        
    document.getElementById('bestseller-grid').innerHTML = filtered.length > 0 ? 
        filtered.slice(0, 8).map(createProductCard).join('') : 
        '<p class="text-center w-100 py-4 text-muted">Đang cập nhật sản phẩm cho mục này...</p>';
}

// =========================================================================
// 5. TỰ ĐỘNG DỰ ĐOÁN KẾT QUẢ TÌM KIẾM KÈM HÌNH ẢNH (Dropdown 4 Hàng)
// =========================================================================
function showSearchSuggestions() {
    const keyword = document.getElementById('global-search').value.toLowerCase().trim();
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (!keyword) {
        suggestionsContainer.classList.add('d-none');
        suggestionsContainer.innerHTML = '';
        return;
    }
    
    const matchedProducts = products.filter(p => 
        p.name.toLowerCase().includes(keyword) || 
        p.brand.toLowerCase().includes(keyword)
    );
    
    const top4Products = matchedProducts.slice(0, 4);
    
    if (top4Products.length === 0) {
        suggestionsContainer.innerHTML = '<div class="p-3 text-muted small text-center">Không tìm thấy sản phẩm phù hợp</div>';
        suggestionsContainer.classList.remove('d-none');
        return;
    }
    
    suggestionsContainer.innerHTML = top4Products.map(p => {
        const match = p.name.match(/mẫu số (\d+)/);
        const itemNumber = match ? parseInt(match[1]) : 1;
        return `
            <div class="d-flex align-items-center p-2 border-bottom suggestion-item" 
                 style="cursor: pointer; transition: background 0.2s;" 
                 onclick="selectSuggestion(${p.id})">
                <div style="width: 45px; height: 45px; flex-shrink: 0;" class="me-3">
                    <img src="${p.image}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: contain; background: #fff;"
                         onerror="handleImageFallback(this, '${p.brand}', ${itemNumber})">
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div class="fw-semibold text-truncate small" style="color: #2c2c2c;">${p.name}</div>
                    <div class="text-danger small fw-bold">${p.price.toLocaleString()}đ</div>
                </div>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.classList.remove('d-none');
}

function selectSuggestion(productId) {
    document.getElementById('search-suggestions').classList.add('d-none');
    document.getElementById('global-search').value = '';
    openDetail(productId);
}

document.addEventListener('click', function(e) {
    const searchBox = document.querySelector('.search-box');
    if (searchBox && !searchBox.contains(e.target)) {
        const container = document.getElementById('search-suggestions');
        if (container) container.classList.add('d-none');
    }
});

function applyFiltersAndSearch() {
    let searchKeyword = document.getElementById('global-search').value.toLowerCase();
    let result = (selectedCategoryGlobal === 'Tất Cả Thương Hiệu') ? 
        [...products] : 
        products.filter(p => p.category.toLowerCase() === selectedCategoryGlobal.toLowerCase());

    if (searchKeyword) {
        result = result.filter(p => p.name.toLowerCase().includes(searchKeyword) || p.brand.toLowerCase().includes(searchKeyword));
    }

    const checkedPrices = Array.from(document.querySelectorAll('.price-box-filter:checked'));
    if (checkedPrices.length > 0) {
        result = result.filter(p => {
            return checkedPrices.some(cb => {
                const [min, max] = cb.value.split('-').map(Number);
                return p.price >= min && p.price <= max;
            });
        });
    }

    const checkedBrands = Array.from(document.querySelectorAll('.brand-box-filter:checked'));
    if (checkedBrands.length > 0) {
        const activeBrands = checkedBrands.map(cb => cb.value.toUpperCase());
        result = result.filter(p => activeBrands.includes(p.brand.toUpperCase()));
    }

    const sortOrder = document.getElementById('sort-order').value;
    if (sortOrder === 'asc') result.sort((a,b) => a.price - b.price);
    if (sortOrder === 'desc') result.sort((a,b) => b.price - a.price);

    currentFilteredProducts = result;
    document.getElementById('catalog-title').innerText = selectedCategoryGlobal.toUpperCase() + " (" + currentFilteredProducts.length + " SẢN PHẨM)";
    
    currentPage = 1; 
    renderCatalogGrid();
    renderPagination();
}

function filterCatalog(category) {
    selectedCategoryGlobal = category;
    currentPage = 1;
    document.querySelectorAll('#main-menu li').forEach(li => {
        if(li.innerText.trim().toLowerCase() === category.toLowerCase()) li.classList.add('active-menu');
        else li.classList.remove('active-menu');
    });
    document.getElementById('catalog-breadcrumb').innerText = category;
    document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
    applyFiltersAndSearch();
    navigateTo('catalog-page');
}

function renderCatalogGrid() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = currentFilteredProducts.slice(startIndex, endIndex);
    document.getElementById('catalog-grid').innerHTML = pageItems.length > 0 ? 
        pageItems.map(createProductCard).join('') : 
        '<p class="text-center w-100 py-4 text-muted">Không tìm thấy sản phẩm phù hợp.</p>';
}

function renderPagination() {
    const totalPages = Math.ceil(currentFilteredProducts.length / itemsPerPage) || 1;
    let html = '<div class="page-item-custom ' + (currentPage === 1 ? 'disabled' : '') + '" onclick="changePage(' + (currentPage - 1) + ')"><i class="fa-solid fa-chevron-left"></i></div>';
    for (let i = 1; i <= totalPages; i++) {
        html += '<div class="page-item-custom ' + (i === currentPage ? 'active' : '') + '" onclick="changePage(' + i + ')">' + i + '</div>';
    }
    html += '<div class="page-item-custom ' + (currentPage === totalPages ? 'disabled' : '') + '" onclick="changePage(' + (currentPage + 1) + ')"><i class="fa-solid fa-chevron-right"></i></div>';
    document.getElementById('pagination-container').innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(currentFilteredProducts.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderCatalogGrid();
    renderPagination();
}

// =========================================================================
// 6. TRANG CHI TIẾT SẢN PHẨM (PRODUCT DETAIL)
// =========================================================================
function openDetail(id) {
    const p = products.find(x => x.id === id);
    currentDetailId = id;
    const match = p.name.match(/mẫu số (\d+)/);
    const itemNumber = match ? parseInt(match[1]) : 1;
    
    document.querySelector('#detail-page .img-placeholder').innerHTML = `
        <img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:contain; border-radius: 6px; background-color:#fff;" 
             onerror="handleImageFallback(this, '${p.brand}', ${itemNumber})">
    `;
    
    document.getElementById('detail-title').innerText = p.name;
    document.getElementById('detail-brand').innerText = p.brand;
    document.getElementById('detail-price').innerText = p.price.toLocaleString() + 'đ';
    document.getElementById('detail-old-price').innerText = p.oldPrice.toLocaleString() + 'đ';
    document.getElementById('detail-qty').value = 1;
    
    renderReviewsList(p);
    resetReviewForm();
    navigateTo('detail-page');
}

function adjustDetailQty(amount) {
    let input = document.getElementById('detail-qty');
    let val = parseInt(input.value) + amount;
    if(val < 1) val = 1;
    input.value = val;
}

function addToCartFromDetail() {
    const qty = parseInt(document.getElementById('detail-qty').value) || 1;
    handleCartClick(currentDetailId, qty);
}

function buyNowFromDetail() {
    const qty = parseInt(document.getElementById('detail-qty').value) || 1;
    const target = products.find(p => p.id === currentDetailId);
    const exist = cart.find(item => item.id === currentDetailId);
    if (exist) exist.qty += qty;
    else cart.push({ ...target, qty: qty });

    document.getElementById('cart-badge').innerText = cart.reduce((sum, i) => sum + i.qty, 0);
    navigateTo('cart-page');
}

// =========================================================================
// 7. YÊU THÍCH & GIỎ HÀNG & ĐẶT HÀNG (WISHLIST, CART & CHECKOUT)
// =========================================================================
function handleWishlistClick(id) {
    const idx = wishlist.indexOf(id);
    if (idx > -1) wishlist.splice(idx, 1);
    else wishlist.push(id);
    
    document.getElementById('wishlist-badge').innerText = wishlist.length;
    
    if (document.getElementById('catalog-page').classList.contains('active')) renderCatalogGrid();
    if (document.getElementById('home-page').classList.contains('active')) buildHomePage();
    if (document.getElementById('wishlist-page').classList.contains('active')) renderWishlistPage();
}

// Chỉnh sửa theo thông tin người nhận mặc định của Kiệt ở Cần Thơ
function handleCartClick(id, qty = 1) {
    const target = products.find(p => p.id === id);
    const exist = cart.find(item => item.id === id);
    if (exist) exist.qty += qty;
    else cart.push({ ...target, qty: qty });

    document.getElementById('cart-badge').innerText = cart.reduce((sum, i) => sum + i.qty, 0);
    alert("Đã thêm vào giỏ hàng thành công sản phẩm: " + target.name);
}

function renderWishlistPage() {
    const items = products.filter(p => wishlist.includes(p.id));
    document.getElementById('wishlist-grid').innerHTML = items.length > 0 ? items.map(createProductCard).join('') : '<p class="p-3 text-muted">Mục yêu thích trống.</p>';
}
function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    if(cart.length === 0) {
        container.innerHTML = '<p class="py-4 text-muted bg-white border rounded p-3">Giỏ hàng trống.</p>';
        document.getElementById('cart-subtotal').innerText = '0đ';
        document.getElementById('cart-total').innerText = '0đ';
        return;
    }
    let total = 0;
    container.innerHTML = cart.map((item) => {
        total += item.price * item.qty;
        return `<div class="cart-item-row bg-white border rounded p-3 mb-3 d-flex align-content-center justify-content-between"><div style="flex:1;"><h4 class="fs-6 fw-bold m-0">${item.name}</h4><div class="small text-danger">${item.price.toLocaleString()}đ</div></div><div class="mx-4">Số lượng: <strong>${item.qty}</strong></div><div class="fw-bold text-end" style="width:120px;">${(item.price * item.qty).toLocaleString()}đ</div></div>`;
    }).join('');
    document.getElementById('cart-subtotal').innerText = total.toLocaleString() + 'đ';
    document.getElementById('cart-total').innerText = (total + 15000).toLocaleString() + 'đ';
}
function renderCheckout() {
    let html = '', total = 0;
    cart.forEach(item => {
        total += item.price * item.qty;
        html += `<div class="d-flex justify-content-between small mb-1"><span>${item.qty}x ${item.name}</span><strong>${(item.price * item.qty).toLocaleString()}đ</strong></div>`;
    });
    document.getElementById('checkout-items-summary').innerHTML = html || '<p class="text-muted small">Chưa có sản phẩm</p>';
    document.getElementById('checkout-total-bill').innerText = (total > 0 ? total + 15000 : 0).toLocaleString() + 'đ';
}
function placeOrder() {
    if (cart.length === 0) return alert("Giỏ hàng đang trống!");
    alert("Xác nhận đặt hàng thành công! Đơn hàng của bạn đã được lưu lại.");
    cart = [];
    document.getElementById('cart-badge').innerText = 0;
    backToHomeDirect();
}

// =========================================================================
// 8. ĐÁNH GIÁ SẢN PHẨM & QUẢN LÝ TÀI KHOẢN
// =========================================================================
function switchTab(element, tabId) {
    const container = element.parentElement;
    container.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    document.querySelectorAll('.tab-content-panel').forEach(tc => tc.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}
function renderReviewsList(product) {
    const container = document.getElementById('product-reviews-list');
    if(!product.reviews || product.reviews.length === 0) {
        container.innerHTML = '<p class="text-muted small">Chưa có đánh giá nào cho sản phẩm này.</p>';
        return;
    }
    container.innerHTML = product.reviews.map(r => {
        let starHtml = '';
        for(let i=1; i<=5; i++) { starHtml += `<i class="fa-solid fa-star" style="color:${i <= r.stars ? 'var(--star-color)' : '#ccc'}"></i>`; }
        return `<div class="review-card mb-2 pb-2"><div class="review-meta fw-bold"><span>${r.author}</span><span class="ms-3">${starHtml}</span></div><p class="small text-muted mt-1">${r.text}</p></div>`;
    }).join('');
}
function initStarsLogic() {
    const stars = document.querySelectorAll('#review-stars .fa-star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedReviewStars = parseInt(this.getAttribute('data-value'));
            stars.forEach(s => {
                if(parseInt(s.getAttribute('data-value')) <= selectedReviewStars) s.classList.add('selected');
                else s.classList.remove('selected');
            });
        });
    });
    stars.forEach(s => s.classList.add('selected'));
}
function handleAccountClick() {
    if (isLoggedIn) { if (confirm("Chào " + currentUser + "! Bạn có muốn đăng xuất không?")) handleLogout(); } 
    else { navigateTo('login-page'); }
}
function handleLogin() { isLoggedIn = true; currentUser = "Hoàng Kiệt"; alert('Đăng nhập thành công!'); updateAccountUI(); backToHomeDirect(); }
function handleRegister() { const regName = document.getElementById('reg-name').value.trim(); isLoggedIn = true; currentUser = regName ? regName : "Hoàng Kiệt"; alert("Đăng ký thành công!"); updateAccountUI(); backToHomeDirect(); }
function handleLogout() { isLoggedIn = false; currentUser = null; alert("Đã đăng xuất!"); updateAccountUI(); backToHomeDirect(); }
function updateAccountUI() { const accountText = document.getElementById('account-text'); if (isLoggedIn) accountText.innerText = currentUser; else accountText.innerText = "Tài khoản"; }
function resetReviewForm() { document.getElementById('review-comment').value = ''; selectedReviewStars = 5; document.querySelectorAll('#review-stars .fa-star').forEach(s => s.classList.add('selected')); }
function submitReview() {
    const text = document.getElementById('review-comment').value.trim();
    if(!text) return alert("Vui lòng ghi nội dung bình luận!");
    const p = products.find(x => x.id === currentDetailId);
    p.reviews.push({ author: "Hoàng Kiệt", stars: selectedReviewStars, date: "Hôm nay", text: text });
    alert("Cảm ơn bạn đã gửi nhận xét thành công!");
    renderReviewsList(p); resetReviewForm();
}

// =========================================================================
// 9. HIỆU ỨNG CÁNH HOA ĐÀO RƠI TỰ ĐỘNG (ĐÃ SỬA LỖI DẤU NHÁY CHÍ MẠNG)
// =========================================================================
function createCherryBlossoms() {
    setInterval(() => {
        const blossom = document.createElement('div');
        blossom.classList.add('cherry-blossom');
        
        const size = Math.random() * 7 + 8; // Kích thước ngẫu nhiên từ 8px - 15px
        blossom.style.width = size + "px";
        blossom.style.height = size + "px";
        blossom.style.left = Math.random() * 100 + 'vw'; // Tọa độ ngang ngẫu nhiên
        
        const duration = Math.random() * 4 + 4; // Tốc độ rơi từ 4s - 8s
        blossom.style.animationDuration = duration + "s";
        blossom.style.opacity = Math.random() * 0.5 + 0.4;
        
        document.body.appendChild(blossom);
        
        // Tự động xóa thẻ div khi hoa rơi hết màn hình để giải phóng RAM
        setTimeout(() => { blossom.remove(); }, duration * 1000);
    }, 300);
}

// =========================================================================
// 10. KHỞI CHẠY HỆ THỐNG APP CHÍNH
// =========================================================================
function initApp() {
    buildHomePage();
    initStarsLogic();
    updateAccountUI(); 
    createCherryBlossoms(); // Kích hoạt hoa đào rơi lả tả
}

window.onload = function() {
    initApp();
    backToHomeDirect();
};