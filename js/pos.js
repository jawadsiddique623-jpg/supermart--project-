/**
 * SuperMart - Cashier POS Logic (pos.js)
 * Clean, modular frontend logic ready for future Laravel Blade + API integration.
 */

// Route Guard - Cashier or Admin can access
Auth.guard('cashier');

const currentUser = Auth.getCurrentUser();

// State
let cart = [];
let activePaymentMethod = 'Cash';
let heldBills = [];
let lastGeneratedBill = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initPOS();
});

function initPOS() {
    renderCashierInfo();
    setupBarcodeScanner();
    renderQuickCategoryFilters();
    renderCart();
    updateShiftStats();
    loadHeldBills();
    loadLastBillPreview();
}

// Render cashier details in top bar
function renderCashierInfo() {
    if (currentUser) {
        const nameEl = document.getElementById('cashier-name');
        if (nameEl) nameEl.textContent = currentUser.name || currentUser.username;
        const branchEl = document.getElementById('branch-name');
        if (branchEl) branchEl.textContent = currentUser.branch || 'Main Branch';
    }
}

/* ==========================================================================
   BARCODE SCANNING & INPUT HANDLING
   ========================================================================== */
function setupBarcodeScanner() {
    const input = document.getElementById('barcode-input');
    if (!input) return;

    // Auto-focus barcode input
    input.focus();

    // Listen for Enter key (from physical scanner or keyboard)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const barcode = input.value.trim();
            if (barcode) {
                handleScanBarcode(barcode);
                input.value = '';
            }
        }
    });

    // Keep scanner input focused when clicking neutral workspace areas
    document.addEventListener('click', (e) => {
        if (!e.target.closest('input, button, select, textarea, .modal-dialog, .table-responsive')) {
            if (document.activeElement.tagName !== 'INPUT') {
                input.focus();
            }
        }
    });
}

function handleScanBarcode(barcode) {
    const product = DB.getProductByBarcode(barcode);

    if (!product) {
        SoundFX.play('error');
        showToast(`Unknown barcode: ${barcode}. Product not found!`, 'error');
        return;
    }

    // Check stock
    if (product.stock <= 0) {
        SoundFX.play('error');
        showToast(`"${product.name}" is OUT OF STOCK!`, 'error');
        return;
    }

    // Add or increment in cart
    addToCart(product);
}

/* ==========================================================================
   CART OPERATIONS
   ========================================================================== */
function addToCart(product, qtyToAdd = 1) {
    const existingIndex = cart.findIndex(item => item.barcode === product.barcode);

    if (existingIndex > -1) {
        const item = cart[existingIndex];
        const newQty = item.qty + qtyToAdd;

        // Check against available stock
        if (newQty > product.stock) {
            SoundFX.play('error');
            showToast(`Cannot add more. Available stock for "${product.shortName || product.name}" is ${product.stock}!`, 'warning');
            return;
        }

        item.qty = newQty;
        item.total = item.qty * item.price;
        SoundFX.play('beep');
        showToast(`Updated "${item.name}" quantity to ${item.qty}`, 'info');
    } else {
        if (qtyToAdd > product.stock) {
            showToast(`Requested quantity exceeds available stock (${product.stock})!`, 'warning');
            return;
        }

        cart.push({
            id: product.id,
            barcode: product.barcode,
            name: product.shortName || product.name,
            fullName: product.name,
            price: Number(product.sellingPrice),
            cost: Number(product.costPrice),
            qty: qtyToAdd,
            stock: product.stock,
            image: product.image,
            emoji: product.emoji || '📦',
            total: qtyToAdd * Number(product.sellingPrice)
        });

        SoundFX.play('beep');
        showToast(`Added "${product.shortName || product.name}" to cart`, 'success');
    }

    renderCart();
    recalculateBill();
}

function updateItemQty(barcode, delta) {
    const item = cart.find(i => i.barcode === barcode);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
        removeFromCart(barcode);
        return;
    }

    // Check stock limit
    const product = DB.getProductByBarcode(barcode);
    if (product && newQty > product.stock) {
        SoundFX.play('error');
        showToast(`Stock limit reached! Only ${product.stock} units available.`, 'warning');
        return;
    }

    item.qty = newQty;
    item.total = item.qty * item.price;
    renderCart();
    recalculateBill();
}

function removeFromCart(barcode) {
    const item = cart.find(i => i.barcode === barcode);
    cart = cart.filter(i => i.barcode !== barcode);
    if (item) {
        showToast(`Removed "${item.name}" from cart`, 'info');
    }
    renderCart();
    recalculateBill();
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm('Are you sure you want to clear the entire cart?')) {
        cart = [];
        renderCart();
        recalculateBill();
        showToast('Cart cleared', 'info');
    }
}

function startNewSale() {
    if (cart.length > 0) {
        if (!confirm('Start a new sale? The current cart will be discarded unless held.')) {
            return;
        }
    }
    cart = [];
    document.getElementById('discount-amount').value = '0';
    renderCart();
    recalculateBill();
    document.getElementById('barcode-input').focus();
    showToast('New sale started. Ready to scan items!', 'info');
}

/* ==========================================================================
   RENDER CART TABLE
   ========================================================================== */
function renderCart() {
    const tableBody = document.getElementById('cart-table-body');
    const emptyState = document.getElementById('cart-empty-state');
    const cartCountEl = document.getElementById('cart-items-count');
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

    if (cartCountEl) {
        cartCountEl.textContent = `(${totalItems} ${totalItems === 1 ? 'Item' : 'Items'})`;
    }

    if (cart.length === 0) {
        if (tableBody) tableBody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (tableBody) {
        tableBody.innerHTML = cart.map((item, index) => `
            <tr>
                <td style="color: var(--text-light); font-weight: 700; width: 30px;">${index + 1}</td>
                <td>
                    <div class="product-cell">
                        <div class="product-thumb">
                            ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : item.emoji}
                        </div>
                        <div class="product-info-text">
                            <div class="p-name">${item.name}</div>
                            <div class="p-barcode">${item.barcode}</div>
                        </div>
                    </div>
                </td>
                <td class="mono" style="color: var(--text-muted); font-size: 12px;">${item.barcode}</td>
                <td style="font-weight: 600;">৳ ${item.price.toFixed(2)}</td>
                <td>
                    <div class="qty-stepper">
                        <button type="button" class="qty-btn" onclick="updateItemQty('${item.barcode}', -1)">-</button>
                        <span class="qty-value">${item.qty}</span>
                        <button type="button" class="qty-btn" onclick="updateItemQty('${item.barcode}', 1)">+</button>
                    </div>
                </td>
                <td style="font-weight: 700; color: #1e293b;">৳ ${item.total.toFixed(2)}</td>
                <td style="text-align: center; width: 40px;">
                    <button type="button" class="btn-remove-item" onclick="removeFromCart('${item.barcode}')" title="Remove item">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

/* ==========================================================================
   BILL SUMMARY & PAYMENT CALCULATIONS
   ========================================================================== */
function recalculateBill() {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discountInput = document.getElementById('discount-amount');
    let discount = Number(discountInput ? discountInput.value : 0) || 0;

    if (discount > subtotal) {
        discount = subtotal;
        if (discountInput) discountInput.value = subtotal;
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const vatRate = 5; // 5% VAT
    const vatAmount = Math.round((taxableAmount * 0.05) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + vatAmount) * 100) / 100;

    // Update DOM values
    const subtotalEl = document.getElementById('bill-subtotal');
    const vatEl = document.getElementById('bill-vat');
    const grandTotalEl = document.getElementById('bill-grand-total');

    if (subtotalEl) subtotalEl.textContent = `৳ ${subtotal.toFixed(2)}`;
    if (vatEl) vatEl.textContent = `৳ ${vatAmount.toFixed(2)}`;
    if (grandTotalEl) grandTotalEl.textContent = `৳ ${grandTotal.toFixed(2)}`;

    // Update Amount Received & Change Due if Cash
    const cashReceivedInput = document.getElementById('amount-received');
    if (cashReceivedInput && activePaymentMethod === 'Cash') {
        // Only set default if field is empty or previously matched grand total
        if (!cashReceivedInput.value || Number(cashReceivedInput.dataset.auto) === 1) {
            cashReceivedInput.value = grandTotal > 0 ? Math.ceil(grandTotal) : 0;
            cashReceivedInput.dataset.auto = '1';
        }
        updateChangeDue(grandTotal);
    }
}

function updateChangeDue(grandTotal = null) {
    if (grandTotal === null) {
        const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
        const discount = Number(document.getElementById('discount-amount')?.value || 0);
        const taxable = Math.max(0, subtotal - discount);
        const vat = taxable * 0.05;
        grandTotal = taxable + vat;
    }

    const cashInput = document.getElementById('amount-received');
    const changeDueEl = document.getElementById('change-due-amount');
    if (!cashInput || !changeDueEl) return;

    const received = Number(cashInput.value) || 0;
    const change = received - grandTotal;

    if (change >= 0) {
        changeDueEl.textContent = `৳ ${change.toFixed(2)}`;
        changeDueEl.style.color = 'var(--success)';
    } else {
        changeDueEl.textContent = `- ৳ ${Math.abs(change).toFixed(2)} (Short)`;
        changeDueEl.style.color = 'var(--danger)';
    }
}

function selectPaymentMethod(method) {
    activePaymentMethod = method;

    document.querySelectorAll('.pay-method-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === method);
    });

    const cashBox = document.getElementById('cash-details-box');
    if (cashBox) {
        cashBox.style.display = method === 'Cash' ? 'flex' : 'none';
    }

    recalculateBill();
}

/* ==========================================================================
   SUBMIT & GENERATE BILL
   ========================================================================== */
function submitAndGenerateBill() {
    if (cart.length === 0) {
        SoundFX.play('error');
        showToast('Cart is empty! Add products before generating a bill.', 'warning');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discount = Number(document.getElementById('discount-amount')?.value || 0);
    const taxable = Math.max(0, subtotal - discount);
    const vatAmount = Math.round((taxable * 0.05) * 100) / 100;
    const grandTotal = Math.round((taxable + vatAmount) * 100) / 100;

    let amountReceived = grandTotal;
    let changeDue = 0;

    if (activePaymentMethod === 'Cash') {
        const cashInput = document.getElementById('amount-received');
        amountReceived = Number(cashInput?.value || 0);
        if (amountReceived < grandTotal) {
            SoundFX.play('error');
            showToast(`Amount received (৳ ${amountReceived}) is less than Grand Total (৳ ${grandTotal})!`, 'error');
            return;
        }
        changeDue = amountReceived - grandTotal;
    }

    // Generate unique sequential / timestamp bill number
    const now = new Date();
    const dateCode = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const timeCode = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const billNo = `${dateCode}${timeCode}`;

    // Build Bill Record
    const newBill = {
        id: 'BILL-' + Date.now().toString().slice(-6),
        billNo: billNo,
        date: now.toISOString(),
        cashierUsername: currentUser ? currentUser.username : 'cashier',
        cashierName: currentUser ? currentUser.name : 'Jawad Siddik',
        branch: currentUser ? currentUser.branch : 'Main Branch, Chattogram',
        paymentMethod: activePaymentMethod,
        items: cart.map(i => ({
            barcode: i.barcode,
            name: i.name,
            price: i.price,
            cost: i.cost,
            qty: i.qty,
            total: i.total
        })),
        subtotal: subtotal,
        discount: discount,
        vatRate: 5,
        vatAmount: vatAmount,
        grandTotal: grandTotal,
        amountReceived: amountReceived,
        changeDue: changeDue
    };

    // Save to LocalStorage & auto-deduct stock
    DB.saveBill(newBill);
    lastGeneratedBill = newBill;

    // Render in Thermal Receipt Preview
    renderThermalReceipt(newBill);

    // Audio & Toast
    SoundFX.play('success');
    showToast(`Bill #${billNo} generated successfully! Stock updated.`, 'success', 4000);

    // Clear cart for next sale
    cart = [];
    document.getElementById('discount-amount').value = '0';
    renderCart();
    recalculateBill();

    // Update bottom shift stats
    updateShiftStats();

    // Re-focus scanner
    document.getElementById('barcode-input').focus();
}

/* ==========================================================================
   THERMAL RECEIPT PREVIEW & PRINTING
   ========================================================================== */
function renderThermalReceipt(bill) {
    const container = document.getElementById('receipt-preview-content');
    if (!container || !bill) return;

    const billDate = new Date(bill.date);
    const dateFormatted = billDate.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const timeFormatted = billDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    container.innerHTML = `
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
                ${bill.paymentMethod === 'Cash' ? `
                <div class="receipt-total-row" style="margin-top: 4px; color: #475569;">
                    <span>Paid: ৳ ${bill.amountReceived.toFixed(2)}</span>
                    <span>Change: ৳ ${bill.changeDue.toFixed(2)}</span>
                </div>` : ''}
            </div>

            <div class="receipt-footer-msg">
                Thank you for shopping with us!<br>Goods once sold can be exchanged within 7 days.
            </div>

            <div class="receipt-barcode">
                <svg class="barcode-svg" viewBox="0 0 160 38">
                    <!-- SVG Barcode lines simulation -->
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
}

function loadLastBillPreview() {
    const bills = DB.getBills();
    if (bills.length > 0) {
        lastGeneratedBill = bills[0];
        renderThermalReceipt(lastGeneratedBill);
    }
}

function printCurrentReceipt() {
    if (!lastGeneratedBill) {
        showToast('No receipt to print yet! Complete a sale first.', 'warning');
        return;
    }
    window.print();
}

/* ==========================================================================
   HOLD & RESUME BILLS
   ========================================================================== */
function holdCurrentBill() {
    if (cart.length === 0) {
        showToast('Cart is empty. Nothing to hold!', 'warning');
        return;
    }

    const heldItem = {
        id: 'HOLD-' + Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        itemsCount: cart.reduce((sum, i) => sum + i.qty, 0),
        total: cart.reduce((sum, i) => sum + i.total, 0)
    };

    heldBills.push(heldItem);
    DB.saveHeldBill(heldItem);

    cart = [];
    renderCart();
    recalculateBill();
    updateHeldCount();

    SoundFX.play('beep');
    showToast(`Bill held successfully (${heldBills.length} held).`, 'info');
}

function loadHeldBills() {
    heldBills = DB.getHeldBills();
    updateHeldCount();
}

function updateHeldCount() {
    const btn = document.getElementById('hold-bill-btn');
    if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-pause"></i> Hold Bill ${heldBills.length > 0 ? `(${heldBills.length})` : ''}`;
    }
}

function showHeldBillsModal() {
    if (heldBills.length === 0) {
        showToast('No held bills found.', 'info');
        return;
    }

    const modalBody = document.getElementById('held-bills-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = heldBills.map((h, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8fafc; border-radius: 12px; margin-bottom: 8px; border: 1px solid #e2e8f0;">
            <div>
                <strong>Held #${idx + 1} (${h.time})</strong>
                <div style="font-size: 12px; color: var(--text-muted);">${h.itemsCount} items &bull; ৳ ${h.total.toFixed(2)}</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-sm btn-primary" onclick="resumeHeldBill('${h.id}')">
                    <i class="fa-solid fa-play"></i> Resume
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteHeldBill('${h.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    openModal('held-bills-modal');
}

function resumeHeldBill(heldId) {
    const held = heldBills.find(h => h.id === heldId);
    if (!held) return;

    if (cart.length > 0) {
        if (!confirm('Resume this held bill? Current cart will be replaced!')) return;
    }

    cart = [...held.items];
    deleteHeldBill(heldId, false);
    closeModal('held-bills-modal');
    renderCart();
    recalculateBill();
    showToast('Held bill resumed into current cart!', 'success');
}

function deleteHeldBill(heldId, confirmPrompt = true) {
    if (confirmPrompt && !confirm('Discard this held bill?')) return;
    heldBills = DB.removeHeldBill(heldId);
    updateHeldCount();
    showHeldBillsModal();
}

/* ==========================================================================
   BOTTOM SHIFT OVERVIEW STATS (For CURRENT Cashier Today)
   ========================================================================== */
function updateShiftStats() {
    const bills = DB.getBills();
    const todayStr = new Date().toDateString();

    // Filter bills created TODAY by THIS LOGGED-IN CASHIER
    const cashierUsername = currentUser ? currentUser.username : 'cashier';
    const shiftBills = bills.filter(b => {
        const billDate = new Date(b.date).toDateString();
        return billDate === todayStr && b.cashierUsername === cashierUsername;
    });

    const shiftSales = shiftBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const shiftCount = shiftBills.length;
    const shiftItems = shiftBills.reduce((sum, b) => {
        return sum + (b.items ? b.items.reduce((iSum, i) => iSum + i.qty, 0) : 0);
    }, 0);

    const salesEl = document.getElementById('shift-sales-val');
    const billsEl = document.getElementById('shift-bills-val');
    const itemsEl = document.getElementById('shift-items-val');

    if (salesEl) salesEl.textContent = `৳ ${shiftSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (billsEl) billsEl.textContent = shiftCount;
    if (itemsEl) itemsEl.textContent = shiftItems;
}

/* ==========================================================================
   MANUAL SEARCH & QUICK CATEGORIES
   ========================================================================== */
function renderQuickCategoryFilters() {
    const categories = DB.getCategories();
    const container = document.getElementById('quick-picks-bar');
    if (!container) return;

    container.innerHTML = `
        <button class="quick-pick-pill active" onclick="filterQuickPick('All', this)">
            <i class="fa-solid fa-border-all"></i> All
        </button>
        ${categories.map(c => `
            <button class="quick-pick-pill" onclick="filterQuickPick('${c.name}', this)">
                <i class="fa-solid ${c.icon || 'fa-tag'}"></i> ${c.name}
            </button>
        `).join('')}
    `;
}

function filterQuickPick(catName, btn) {
    document.querySelectorAll('.quick-pick-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Open Manual Search modal filtered by this category
    openManualSearch(catName);
}

function openManualSearch(selectedCategory = 'All') {
    const modal = document.getElementById('manual-search-modal');
    if (!modal) return;

    const catSelect = document.getElementById('manual-search-category');
    if (catSelect) {
        const categories = DB.getCategories();
        catSelect.innerHTML = `<option value="All">All Categories</option>` +
            categories.map(c => `<option value="${c.name}" ${c.name === selectedCategory ? 'selected' : ''}>${c.name}</option>`).join('');
    }

    renderManualSearchResults();
    openModal('manual-search-modal');

    setTimeout(() => {
        const searchInput = document.getElementById('manual-search-input');
        if (searchInput) searchInput.focus();
    }, 100);
}

function renderManualSearchResults() {
    const query = (document.getElementById('manual-search-input')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('manual-search-category')?.value || 'All';
    const products = DB.getProducts();

    const filtered = products.filter(p => {
        const matchCat = cat === 'All' || p.category === cat;
        const matchQuery = !query || p.name.toLowerCase().includes(query) || String(p.barcode).includes(query);
        return matchCat && matchQuery;
    });

    const resultsList = document.getElementById('manual-search-results');
    if (!resultsList) return;

    if (filtered.length === 0) {
        resultsList.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">No products match your search.</div>`;
        return;
    }

    resultsList.innerHTML = filtered.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #f1f5f9; transition: var(--transition);">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="product-thumb" style="width: 36px; height: 36px; font-size: 16px;">
                    ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">` : (p.emoji || '📦')}
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 13px;">${p.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">
                        Barcode: <span class="mono">${p.barcode}</span> &bull; Stock: <span style="font-weight:700; color: ${p.stock <= p.reorderLevel ? 'var(--danger)' : 'var(--success)'};">${p.stock}</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-weight: 700; font-size: 14px; color: #1e293b;">৳ ${p.sellingPrice.toFixed(2)}</div>
                <button class="btn btn-sm btn-primary" onclick="addToCartFromSearch('${p.barcode}')" ${p.stock <= 0 ? 'disabled' : ''}>
                    <i class="fa-solid fa-cart-plus"></i> Add
                </button>
            </div>
        </div>
    `).join('');
}

function addToCartFromSearch(barcode) {
    const product = DB.getProductByBarcode(barcode);
    if (product) {
        addToCart(product);
        renderManualSearchResults(); // refresh stocks
    }
}

/* ==========================================================================
   MODAL HELPERS
   ========================================================================== */
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
    // Refocus barcode scanner
    const barcodeInput = document.getElementById('barcode-input');
    if (barcodeInput) barcodeInput.focus();
}

