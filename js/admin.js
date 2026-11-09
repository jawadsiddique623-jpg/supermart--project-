/**
 * SuperMart - Admin Dashboard Logic (admin.js)
 * Clean, structured vanilla JavaScript for Laravel Blade + API readiness.
 */

// Route Guard - Must be Admin
Auth.guard('admin');

// State
let currentSection = 'dashboard';
let weeklyChartInstance = null;
let stockDonutInstance = null;
let productCurrentPage = 1;
const PRODUCTS_PER_PAGE = 7;
let editingProductId = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

function initAdmin() {
    setupSidebarNavigation();
    setupGlobalSearch();
    renderAllSections();
}

/* ==========================================================================
   NAVIGATION & SECTION SWITCHING
   ========================================================================== */
function setupSidebarNavigation() {
    document.querySelectorAll('.sidebar-nav .nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionName = link.getAttribute('data-section');
            switchSection(sectionName);
        });
    });
}

function switchSection(sectionName) {
    currentSection = sectionName;

    // Update active nav link
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-section') === sectionName);
    });

    // Toggle active section container
    document.querySelectorAll('.admin-content-section').forEach(sec => {
        sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`section-${sectionName}`);
    if (targetSec) {
        targetSec.classList.add('active');
    }

    // Refresh data for the newly active section
    if (sectionName === 'dashboard') {
        renderDashboard();
    } else if (sectionName === 'products') {
        renderProductsTable();
    } else if (sectionName === 'categories') {
        renderCategories();
    } else if (sectionName === 'inventory') {
        renderInventoryTable();
    } else if (sectionName === 'sales') {
        renderSalesTable();
    } else if (sectionName === 'purchases') {
        renderPurchasesTable();
    } else if (sectionName === 'suppliers') {
        renderSuppliersTable();
    } else if (sectionName === 'reports') {
        renderReports();
    } else if (sectionName === 'users') {
        renderUsersTable();
    } else if (sectionName === 'settings') {
        loadSettingsForm();
    }
}

function renderAllSections() {
    renderDashboard();
    renderProductsTable();
    renderCategories();
    renderInventoryTable();
    renderSalesTable();
    renderPurchasesTable();
    renderSuppliersTable();
    renderReports();
    renderUsersTable();
    loadSettingsForm();
}

/* ==========================================================================
   DASHBOARD SECTION & CHARTS
   ========================================================================== */
function renderDashboard() {
    const products = DB.getProducts();
    const bills = DB.getBills();
    const suppliers = DB.getSuppliers();

    // Calculate KPIs
    const totalProducts = products.length;
    const totalSales = bills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
    const lowStockItems = products.filter(p => p.stock <= p.reorderLevel).length;
    const totalSuppliers = suppliers.length;

    // Update KPI DOM
    const kpiProducts = document.getElementById('kpi-total-products');
    const kpiSales = document.getElementById('kpi-total-sales');
    const kpiLowStock = document.getElementById('kpi-low-stock');
    const kpiSuppliers = document.getElementById('kpi-total-suppliers');

    if (kpiProducts) kpiProducts.textContent = totalProducts.toLocaleString();
    if (kpiSales) kpiSales.textContent = `৳ ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (kpiLowStock) kpiLowStock.textContent = lowStockItems;
    if (kpiSuppliers) kpiSuppliers.textContent = totalSuppliers;

    // Render Charts
    initWeeklySalesChart(bills);
    initStockDonutChart(products);

    // Render Low Stock Table & Recent Activities
    renderLowStockAlerts(products);
    renderRecentActivities(bills);
    renderTopSellingProducts(bills);
    renderSalesByCashier(bills);
}

function initWeeklySalesChart(bills) {
    const canvas = document.getElementById('weeklySalesChart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Calculate sales over the last 7 days
    const days = [];
    const salesByDay = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        days.push(dayLabel);

        const dateStr = d.toDateString();
        const dayTotal = bills
            .filter(b => new Date(b.date).toDateString() === dateStr)
            .reduce((sum, b) => sum + (b.grandTotal || 0), 0);

        salesByDay.push(Math.round(dayTotal));
    }

    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Sales (৳)',
                data: salesByDay,
                backgroundColor: 'rgba(37, 99, 235, 0.85)',
                hoverBackgroundColor: 'rgba(37, 99, 235, 1)',
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Sales: ৳ ${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(226, 232, 240, 0.6)' },
                    ticks: {
                        callback: function (val) {
                            return '৳' + val;
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function initStockDonutChart(products) {
    const canvas = document.getElementById('stockOverviewChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const inStock = products.filter(p => p.stock > p.reorderLevel).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const total = products.length || 1;

    const inStockPct = Math.round((inStock / total) * 100);

    const inStockLegend = document.getElementById('donut-in-stock-val');
    const lowStockLegend = document.getElementById('donut-low-stock-val');
    const outOfStockLegend = document.getElementById('donut-out-stock-val');
    const donutCenterText = document.getElementById('donut-center-pct');

    if (inStockLegend) inStockLegend.textContent = inStock;
    if (lowStockLegend) lowStockLegend.textContent = lowStock;
    if (outOfStockLegend) outOfStockLegend.textContent = outOfStock;
    if (donutCenterText) donutCenterText.textContent = `${inStockPct}%`;

    if (stockDonutInstance) {
        stockDonutInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    stockDonutInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['In Stock', 'Low Stock', 'Out of Stock'],
            datasets: [{
                data: [inStock, lowStock, outOfStock],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                cutout: '76%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            return ` ${ctx.label}: ${ctx.raw} items`;
                        }
                    }
                }
            }
        }
    });
}

function renderLowStockAlerts(products) {
    const list = document.getElementById('low-stock-alerts-body');
    if (!list) return;

    const lowStock = products.filter(p => p.stock <= p.reorderLevel);

    if (lowStock.length === 0) {
        list.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 20px;">All items sufficiently stocked!</td></tr>`;
        return;
    }

    list.innerHTML = lowStock.map(p => `
        <tr>
            <td>
                <div class="product-cell">
                    <div class="product-thumb" style="width: 32px; height: 32px; font-size: 14px;">
                        ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">` : (p.emoji || '📦')}
                    </div>
                    <div>
                        <strong>${p.name}</strong>
                        <div class="mono" style="font-size: 11px; color: var(--text-light);">${p.barcode}</div>
                    </div>
                </div>
            </td>
            <td>${p.category}</td>
            <td><span class="badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'}">${p.stock} / ${p.reorderLevel} min</span></td>
            <td>৳ ${p.costPrice.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openStockInModal('${p.barcode}')">
                    <i class="fa-solid fa-plus"></i> Reorder
                </button>
            </td>
        </tr>
    `).join('');
}

function renderRecentActivities(bills) {
    const list = document.getElementById('recent-activities-list');
    if (!list) return;

    const recentBills = bills.slice(0, 5);

    if (recentBills.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No recent activities logged.</div>`;
        return;
    }

    list.innerHTML = recentBills.map(b => {
        const timeAgo = formatTimeAgo(new Date(b.date));
        return `
            <div class="activity-item">
                <div class="activity-icon" style="background: #dbeafe; color: var(--primary);">
                    <i class="fa-solid fa-cart-shopping"></i>
                </div>
                <div class="activity-info">
                    <div class="activity-title">New Sale Recorded &bull; Bill #${b.billNo}</div>
                    <div class="activity-desc">৳ ${b.grandTotal.toFixed(2)} worth of products sold by ${b.cashierName} (${b.paymentMethod})</div>
                </div>
                <div class="activity-time">${timeAgo}</div>
            </div>
        `;
    }).join('');
}

function renderTopSellingProducts(bills) {
    const container = document.getElementById('top-selling-products-list');
    if (!container) return;

    // Aggregate sold items
    const itemMap = {};
    bills.forEach(b => {
        (b.items || []).forEach(item => {
            if (!itemMap[item.barcode]) {
                itemMap[item.barcode] = { name: item.name, qty: 0, revenue: 0 };
            }
            itemMap[item.barcode].qty += Number(item.qty);
            itemMap[item.barcode].revenue += Number(item.total);
        });
    });

    const sorted = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No sales recorded yet.</div>`;
        return;
    }

    container.innerHTML = sorted.map((p, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 800; color: var(--text-light); width: 18px;">${idx + 1}</span>
                <div>
                    <strong>${p.name}</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">${p.qty} units sold</div>
                </div>
            </div>
            <strong style="color: var(--primary);">৳ ${p.revenue.toFixed(2)}</strong>
        </div>
    `).join('');
}

function renderSalesByCashier(bills) {
    const container = document.getElementById('sales-by-cashier-list');
    if (!container) return;

    const cashierMap = {};
    bills.forEach(b => {
        const cName = b.cashierName || 'Cashier';
        if (!cashierMap[cName]) {
            cashierMap[cName] = { name: cName, billsCount: 0, revenue: 0 };
        }
        cashierMap[cName].billsCount += 1;
        cashierMap[cName].revenue += Number(b.grandTotal) || 0;
    });

    const list = Object.values(cashierMap);
    if (list.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No cashier sales recorded yet.</div>`;
        return;
    }

    container.innerHTML = list.map(c => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: #eff6ff; color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">
                    ${c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                    <strong>${c.name}</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">${c.billsCount} transactions handled</div>
                </div>
            </div>
            <strong style="color: var(--success);">৳ ${c.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
    `).join('');
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

/* ==========================================================================
   PRODUCTS MANAGEMENT CRUD
   ========================================================================== */
function renderProductsTable() {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;

    const products = DB.getProducts();
    const query = (document.getElementById('product-search-input')?.value || '').toLowerCase().trim();
    const catFilter = document.getElementById('product-category-filter')?.value || 'All';
    const stockFilter = document.getElementById('product-stock-filter')?.value || 'All';

    // Populate category dropdown filter if empty
    populateProductFilterDropdowns();

    const filtered = products.filter(p => {
        const matchSearch = !query || p.name.toLowerCase().includes(query) || String(p.barcode).includes(query);
        const matchCat = catFilter === 'All' || p.category === catFilter;
        let matchStock = true;
        if (stockFilter === 'low') matchStock = p.stock > 0 && p.stock <= p.reorderLevel;
        if (stockFilter === 'out') matchStock = p.stock === 0;
        if (stockFilter === 'in') matchStock = p.stock > p.reorderLevel;
        return matchSearch && matchCat && matchStock;
    });

    // Pagination
    const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE) || 1;
    if (productCurrentPage > totalPages) productCurrentPage = totalPages;
    const startIndex = (productCurrentPage - 1) * PRODUCTS_PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

    // Update pagination counters
    const pageIndicator = document.getElementById('product-page-indicator');
    if (pageIndicator) pageIndicator.textContent = `Page ${productCurrentPage} of ${totalPages} (${filtered.length} products)`;

    if (paginated.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 40px; color: var(--text-muted);">No products found matching filters.</td></tr>`;
        return;
    }

    tableBody.innerHTML = paginated.map(p => {
        let statusBadge = '<span class="badge badge-success">In Stock</span>';
        if (p.stock === 0) {
            statusBadge = '<span class="badge badge-danger">Out of Stock</span>';
        } else if (p.stock <= p.reorderLevel) {
            statusBadge = '<span class="badge badge-warning">Low Stock</span>';
        }

        return `
            <tr>
                <td>
                    <div class="product-cell">
                        <div class="product-thumb">
                            ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` : (p.emoji || '📦')}
                        </div>
                        <div>
                            <strong>${p.name}</strong>
                            <div style="font-size: 11px; color: var(--text-muted);">${p.unit || 'pcs'}</div>
                        </div>
                    </div>
                </td>
                <td class="mono"><strong>${p.barcode}</strong></td>
                <td><span class="badge badge-primary">${p.category}</span></td>
                <td>৳ ${p.costPrice.toFixed(2)}</td>
                <td style="font-weight: 700; color: #1e293b;">৳ ${p.sellingPrice.toFixed(2)}</td>
                <td style="font-weight: 700;">${p.stock}</td>
                <td>${p.reorderLevel}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn btn-sm btn-outline" onclick="openEditProductModal('${p.id}')" title="Edit">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')" title="Delete">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function populateProductFilterDropdowns() {
    const catSelect = document.getElementById('product-category-filter');
    const modalCatSelect = document.getElementById('prod-form-category');
    if (!catSelect && !modalCatSelect) return;

    const categories = DB.getCategories();
    if (catSelect && catSelect.children.length <= 1) {
        catSelect.innerHTML = `<option value="All">All Categories</option>` +
            categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }
    if (modalCatSelect) {
        modalCatSelect.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }
}

function prevProductPage() {
    if (productCurrentPage > 1) {
        productCurrentPage--;
        renderProductsTable();
    }
}

function nextProductPage() {
    const products = DB.getProducts();
    const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
    if (productCurrentPage < totalPages) {
        productCurrentPage++;
        renderProductsTable();
    }
}

/* Add / Edit Product Modal Handling */
function openAddProductModal() {
    editingProductId = null;
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    populateProductFilterDropdowns();

    // Auto-generate suggestion barcode
    const products = DB.getProducts();
    const lastBarcode = products.reduce((max, p) => Math.max(max, Number(p.barcode) || 100000), 100000);
    document.getElementById('prod-form-barcode').value = lastBarcode + 1;

    openModal('product-modal');
}

function openEditProductModal(productId) {
    const p = DB.getProductById(productId);
    if (!p) return;

    editingProductId = productId;
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    populateProductFilterDropdowns();

    document.getElementById('prod-form-name').value = p.name;
    document.getElementById('prod-form-barcode').value = p.barcode;
    document.getElementById('prod-form-category').value = p.category;
    document.getElementById('prod-form-cost').value = p.costPrice;
    document.getElementById('prod-form-price').value = p.sellingPrice;
    document.getElementById('prod-form-stock').value = p.stock;
    document.getElementById('prod-form-reorder').value = p.reorderLevel;
    document.getElementById('prod-form-image').value = p.image || '';

    openModal('product-modal');
}

function handleSaveProductSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('prod-form-name').value.trim();
    const barcode = document.getElementById('prod-form-barcode').value.trim();
    const category = document.getElementById('prod-form-category').value;
    const costPrice = Number(document.getElementById('prod-form-cost').value);
    const sellingPrice = Number(document.getElementById('prod-form-price').value);
    const stock = Number(document.getElementById('prod-form-stock').value);
    const reorderLevel = Number(document.getElementById('prod-form-reorder').value);
    const image = document.getElementById('prod-form-image').value.trim();

    // Barcode duplicate validation
    const existing = DB.getProductByBarcode(barcode);
    if (existing && (!editingProductId || existing.id !== editingProductId)) {
        SoundFX.play('error');
        showToast(`Barcode "${barcode}" already exists for "${existing.name}"! Barcodes must be unique.`, 'error');
        return;
    }

    const productPayload = {
        id: editingProductId || 'PRD-' + Date.now().toString().slice(-6),
        name: name,
        shortName: name,
        barcode: barcode,
        category: category,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        stock: stock,
        reorderLevel: reorderLevel,
        image: image || null,
        emoji: '📦'
    };

    DB.saveProduct(productPayload);
    closeModal('product-modal');
    renderProductsTable();
    renderDashboard();

    SoundFX.play('success');
    showToast(`Product "${name}" saved successfully! It is now scannable in the POS.`, 'success');
}

function deleteProduct(id) {
    const p = DB.getProductById(id);
    if (!p) return;

    if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
        DB.deleteProduct(id);
        renderProductsTable();
        renderDashboard();
        showToast(`Deleted product "${p.name}".`, 'info');
    }
}

/* ==========================================================================
   INVENTORY & STOCK-IN MANAGEMENT
   ========================================================================== */
function renderInventoryTable() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    const products = DB.getProducts();

    tableBody.innerHTML = products.map(p => {
        let statusBadge = '<span class="badge badge-success">Optimal</span>';
        if (p.stock === 0) {
            statusBadge = '<span class="badge badge-danger">Out of Stock</span>';
        } else if (p.stock <= p.reorderLevel) {
            statusBadge = '<span class="badge badge-warning">Low Stock Warning</span>';
        }

        const stockValue = (p.stock * p.costPrice).toFixed(2);

        return `
            <tr>
                <td><strong>${p.name}</strong></td>
                <td class="mono">${p.barcode}</td>
                <td>${p.category}</td>
                <td style="font-weight: 700;">${p.stock}</td>
                <td>${p.reorderLevel}</td>
                <td>৳ ${stockValue}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openStockInModal('${p.barcode}')">
                        <i class="fa-solid fa-arrow-down-to-bracket"></i> Stock-In
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openStockInModal(barcode = null) {
    const products = DB.getProducts();
    const select = document.getElementById('stockin-product-select');
    if (select) {
        select.innerHTML = products.map(p => `
            <option value="${p.barcode}" ${p.barcode === barcode ? 'selected' : ''}>
                ${p.name} (Current Stock: ${p.stock})
            </option>
        `).join('');
    }

    const supplierSelect = document.getElementById('stockin-supplier-select');
    if (supplierSelect) {
        const suppliers = DB.getSuppliers();
        supplierSelect.innerHTML = suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    }

    document.getElementById('stockin-qty').value = '10';
    openModal('stockin-modal');
}

function handleStockInSubmit(e) {
    e.preventDefault();
    const barcode = document.getElementById('stockin-product-select').value;
    const qty = Number(document.getElementById('stockin-qty').value);
    const supplier = document.getElementById('stockin-supplier-select').value;
    const notes = document.getElementById('stockin-notes')?.value || 'Stock replenishment';

    if (qty <= 0) {
        showToast('Quantity must be greater than zero!', 'warning');
        return;
    }

    // Increase stock in localStorage
    const updatedProduct = DB.adjustProductStock(barcode, qty);

    // Record purchase order
    DB.savePurchase({
        id: 'PO-' + Date.now().toString().slice(-6),
        supplier: supplier,
        date: new Date().toISOString(),
        items: `${updatedProduct.name} (+${qty} units)`,
        totalCost: qty * updatedProduct.costPrice,
        status: 'Received',
        notes: notes
    });

    closeModal('stockin-modal');
    renderInventoryTable();
    renderProductsTable();
    renderPurchasesTable();
    renderDashboard();

    SoundFX.play('success');
    showToast(`Added ${qty} units to "${updatedProduct.name}". New Stock: ${updatedProduct.stock}!`, 'success');
}

/* ==========================================================================
   SALES & RECEIPT REPRINT
   ========================================================================== */
function renderSalesTable() {
    const tableBody = document.getElementById('sales-table-body');
    if (!tableBody) return;

    const bills = DB.getBills();
    const query = (document.getElementById('sales-search-input')?.value || '').toLowerCase().trim();
    const dateFilter = document.getElementById('sales-date-filter')?.value || 'all';

    const now = new Date();
    const filtered = bills.filter(b => {
        const matchQuery = !query || b.billNo.includes(query) || b.cashierName.toLowerCase().includes(query);
        let matchDate = true;
        const bDate = new Date(b.date);

        if (dateFilter === 'today') {
            matchDate = bDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            matchDate = bDate >= weekAgo;
        }

        return matchQuery && matchDate;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; color: var(--text-muted);">No bills found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = filtered.map(b => {
        const d = new Date(b.date);
        const dateStr = d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const itemsCount = b.items ? b.items.reduce((s, i) => s + i.qty, 0) : 0;

        return `
            <tr>
                <td class="mono"><strong>#${b.billNo}</strong></td>
                <td>${dateStr}</td>
                <td><strong>${b.cashierName}</strong></td>
                <td>${itemsCount} items</td>
                <td style="font-weight: 800; color: #1e293b;">৳ ${b.grandTotal.toFixed(2)}</td>
                <td><span class="badge ${b.paymentMethod === 'bKash' ? 'badge-primary' : 'badge-success'}">${b.paymentMethod}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="viewBillReceipt('${b.billNo}')">
                        <i class="fa-solid fa-receipt"></i> View Receipt
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewBillReceipt(billNo) {
    const bill = DB.getBillById(billNo);
    if (!bill) return;

    const billDate = new Date(bill.date);
    const dateFormatted = billDate.toLocaleDateString('en-GB');
    const timeFormatted = billDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const content = document.getElementById('view-receipt-modal-body');
    if (!content) return;

    content.innerHTML = `
        <div class="thermal-receipt" id="printable-receipt-area">
            <div class="receipt-store-name">SuperMart</div>
            <div class="receipt-store-sub">Smart Shopping, Better Life<br>${bill.branch}</div>

            <div class="receipt-meta">
                <div class="receipt-meta-row">
                    <span>Date: ${dateFormatted}</span>
                    <span>Time: ${timeFormatted}</span>
                </div>
                <div class="receipt-meta-row">
                    <span>Bill No: ${bill.billNo}</span>
                    <span>Pay: ${bill.paymentMethod}</span>
                </div>
                <div class="receipt-meta-row">
                    <span>Cashier: ${bill.cashierName}</span>
                </div>
            </div>

            <table class="receipt-table">
                <thead>
                    <tr>
                        <th style="width: 50%;">Item</th>
                        <th class="text-center" style="width: 15%;">Qty</th>
                        <th class="text-right" style="width: 15%;">Price</th>
                        <th class="text-right" style="width: 20%;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${bill.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td class="text-center">${item.qty}</td>
                            <td class="text-right">৳${item.price}</td>
                            <td class="text-right">৳${item.total}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="receipt-totals">
                <div class="receipt-total-row">
                    <span>Subtotal:</span>
                    <span>৳ ${bill.subtotal.toFixed(2)}</span>
                </div>
                ${bill.discount > 0 ? `
                <div class="receipt-total-row">
                    <span>Discount:</span>
                    <span>- ৳ ${bill.discount.toFixed(2)}</span>
                </div>` : ''}
                <div class="receipt-total-row">
                    <span>VAT (5%):</span>
                    <span>৳ ${bill.vatAmount.toFixed(2)}</span>
                </div>
                <div class="receipt-total-row grand">
                    <span>TOTAL:</span>
                    <span>৳ ${bill.grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <div class="receipt-footer-msg">
                Thank you for shopping with us!<br>Goods once sold can be exchanged within 7 days.
            </div>

            <div class="receipt-barcode">
                <svg class="barcode-svg" viewBox="0 0 160 38">
                    <rect x="0" y="0" width="3" height="38" fill="#111827"/>
                    <rect x="5" y="0" width="2" height="38" fill="#111827"/>
                    <rect x="10" y="0" width="4" height="38" fill="#111827"/>
                    <rect x="16" y="0" width="1" height="38" fill="#111827"/>
                    <rect x="20" y="0" width="3" height="38" fill="#111827"/>
                    <rect x="26" y="0" width="5" height="38" fill="#111827"/>
                    <rect x="34" y="0" width="2" height="38" fill="#111827"/>
                    <rect x="39" y="0" width="4" height="38" fill="#111827"/>
                    <rect x="46" y="0" width="2" height="38" fill="#111827"/>
                    <rect x="51" y="0" width="5" height="38" fill="#111827"/>
                    <rect x="59" y="0" width="2" height="38" fill="#111827"/>
                    <rect x="64" y="0" width="3" height="38" fill="#111827"/>
                    <rect x="70" y="0" width="4" height="38" fill="#111827"/>
                    <rect x="77" y="0" width="1" height="38" fill="#111827"/>
                    <rect x="81" y="0" width="3" height="38" fill="#111827"/>
                    <rect x="87" y="0" width="5" height="38" fill="#111827"/>
                    <rect x="95" y="0" width="2" height="38" fill="#111827"/>
                    <rect x="100" y="0" width="4" height="38" fill="#111827"/>
                    <rect x="107" y="0" width="2" height="38" fill="#111827"/>
                    <rect x="112" y="0" width="5" height="38" fill="#111827"/>
                    <rect x="120" y="0" width="3" height="38" fill="#111827"/>
                    <rect x="126" y="0" width="2" height="38" fill="#111827"/>
                    <rect x="131" y="0" width="4" height="38" fill="#111827"/>
                    <rect x="138" y="0" width="2" height="38" fill="#111827"/>
                    <rect x="143" y="0" width="5" height="38" fill="#111827"/>
                    <rect x="151" y="0" width="2" height="38" fill="#111827"/>
                    <rect x="156" y="0" width="4" height="38" fill="#111827"/>
                </svg>
                <div class="barcode-number">${bill.billNo}</div>
            </div>
        </div>
    `;

    openModal('view-receipt-modal');
}

/* ==========================================================================
   REPORTS & CSV EXPORT
   ========================================================================== */
function renderReports() {
    const bills = DB.getBills();

    const totalRevenue = bills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const totalCost = bills.reduce((sum, b) => {
        return sum + (b.items || []).reduce((iSum, i) => iSum + ((i.cost || 0) * i.qty), 0);
    }, 0);
    const grossProfit = totalRevenue - totalCost;
    const totalBills = bills.length;
    const avgBill = totalBills > 0 ? totalRevenue / totalBills : 0;

    const revEl = document.getElementById('report-total-revenue');
    const profitEl = document.getElementById('report-gross-profit');
    const countEl = document.getElementById('report-total-bills');
    const avgEl = document.getElementById('report-avg-bill');

    if (revEl) revEl.textContent = `৳ ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (profitEl) profitEl.textContent = `৳ ${grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (countEl) countEl.textContent = totalBills;
    if (avgEl) avgEl.textContent = `৳ ${avgBill.toFixed(2)}`;
}

function exportSalesReportCSV() {
    const bills = DB.getBills();
    if (bills.length === 0) {
        showToast('No sales data to export!', 'warning');
        return;
    }

    const headers = ['Bill No', 'Date & Time', 'Cashier', 'Items Sold', 'Subtotal (BDT)', 'Discount (BDT)', 'VAT 5% (BDT)', 'Grand Total (BDT)', 'Payment Method'];
    const rows = bills.map(b => [
        `"${b.billNo}"`,
        `"${new Date(b.date).toLocaleString()}"`,
        `"${b.cashierName}"`,
        `"${(b.items || []).map(i => `${i.name} (x${i.qty})`).join('; ')}"`,
        b.subtotal.toFixed(2),
        b.discount.toFixed(2),
        b.vatAmount.toFixed(2),
        b.grandTotal.toFixed(2),
        `"${b.paymentMethod}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SuperMart_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast('Sales Report CSV generated and downloaded successfully!', 'success');
}

/* ==========================================================================
   CATEGORIES, PURCHASES, SUPPLIERS, USERS (CRUD)
   ========================================================================== */
function renderCategories() {
    const list = document.getElementById('categories-grid');
    if (!list) return;

    DB.updateCategoryCounts();
    const categories = DB.getCategories();

    list.innerHTML = categories.map(c => `
        <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: #eff6ff; color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    <i class="fa-solid ${c.icon || 'fa-tag'}"></i>
                </div>
                <span class="badge badge-primary">${c.count || 0} Products</span>
            </div>
            <div>
                <h4 style="font-size: 16px; margin-bottom: 4px;">${c.name}</h4>
                <p style="font-size: 12px; color: var(--text-muted);">Active in POS Catalog</p>
            </div>
            <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end;">
                <button class="btn btn-sm btn-ghost" onclick="deleteCategory('${c.id}')" style="color: var(--danger);">
                    <i class="fa-solid fa-trash-can"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function handleAddCategorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name-input').value.trim();
    const icon = document.getElementById('cat-icon-input').value.trim() || 'fa-tag';

    if (!name) return;

    DB.saveCategory({ name, icon });
    closeModal('category-modal');
    renderCategories();
    populateProductFilterDropdowns();
    showToast(`Category "${name}" added!`, 'success');
}

function deleteCategory(id) {
    if (confirm('Delete this category?')) {
        DB.deleteCategory(id);
        renderCategories();
        showToast('Category deleted', 'info');
    }
}

function renderPurchasesTable() {
    const tbody = document.getElementById('purchases-table-body');
    if (!tbody) return;

    const purchases = DB.getPurchases();
    tbody.innerHTML = purchases.map(po => `
        <tr>
            <td class="mono"><strong>#${po.id}</strong></td>
            <td>${po.supplier}</td>
            <td>${new Date(po.date).toLocaleDateString()}</td>
            <td>${po.items}</td>
            <td style="font-weight: 700;">৳ ${po.totalCost.toLocaleString()}</td>
            <td><span class="badge badge-success">${po.status}</span></td>
        </tr>
    `).join('');
}

function renderSuppliersTable() {
    const tbody = document.getElementById('suppliers-table-body');
    if (!tbody) return;

    const suppliers = DB.getSuppliers();
    tbody.innerHTML = suppliers.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.contact}</td>
            <td>${s.phone}</td>
            <td>${s.email}</td>
            <td>${s.address}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteSupplier('${s.id}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function handleAddSupplierSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('sup-name').value.trim();
    const contact = document.getElementById('sup-contact').value.trim();
    const phone = document.getElementById('sup-phone').value.trim();
    const email = document.getElementById('sup-email').value.trim();
    const address = document.getElementById('sup-address').value.trim();

    DB.saveSupplier({ name, contact, phone, email, address });
    closeModal('supplier-modal');
    renderSuppliersTable();
    showToast(`Supplier "${name}" saved!`, 'success');
}

function deleteSupplier(id) {
    if (confirm('Delete this supplier?')) {
        DB.deleteSupplier(id);
        renderSuppliersTable();
        showToast('Supplier deleted', 'info');
    }
}

function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    const users = DB.getUsers();
    tbody.innerHTML = users.map(u => `
        <tr>
            <td><strong>${u.name}</strong></td>
            <td class="mono">${u.username}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-success'}">${u.roleTitle || u.role}</span></td>
            <td>${u.branch || 'Main Branch'}</td>
            <td><span class="badge badge-success">${u.status || 'Active'}</span></td>
        </tr>
    `).join('');
}

/* ==========================================================================
   SETTINGS & RESET DEMO DATA
   ========================================================================== */
function loadSettingsForm() {
    const s = DB.getSettings();
    document.getElementById('set-store-name').value = s.storeName || 'SuperMart';
    document.getElementById('set-branch').value = s.branch || 'Main Branch, Chattogram';
    document.getElementById('set-phone').value = s.phone || '';
    document.getElementById('set-email').value = s.email || '';
    document.getElementById('set-vat').value = s.vatRate || 5;
    document.getElementById('set-footer-msg').value = s.receiptFooter || '';
}

function handleSaveSettings(e) {
    e.preventDefault();
    DB.saveSettings({
        storeName: document.getElementById('set-store-name').value.trim(),
        branch: document.getElementById('set-branch').value.trim(),
        phone: document.getElementById('set-phone').value.trim(),
        email: document.getElementById('set-email').value.trim(),
        vatRate: Number(document.getElementById('set-vat').value),
        receiptFooter: document.getElementById('set-footer-msg').value.trim()
    });
    showToast('Store settings updated successfully!', 'success');
}

function resetDemoData() {
    if (confirm('Reset all demo data? This will restore original 20 products, categories, suppliers, and past demo bills.')) {
        DB.reset();
        renderAllSections();
        SoundFX.play('success');
        showToast('Demo data reset to factory default!', 'success');
    }
}

/* ==========================================================================
   GLOBAL SEARCH IN TOP BAR
   ========================================================================== */
function setupGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (q.length > 0 && currentSection !== 'products') {
            switchSection('products');
            const prodInput = document.getElementById('product-search-input');
            if (prodInput) {
                prodInput.value = q;
                renderProductsTable();
            }
        }
    });
}

/* Modal Helpers */
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}
