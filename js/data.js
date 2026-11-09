/**
 * SuperMart - Data Store & LocalStorage Persistence Layer
 * Simulates database models for Products, Categories, Bills, Suppliers, Purchases, and Settings.
 */

const STORAGE_KEYS = {
    PRODUCTS: 'supermart_products',
    CATEGORIES: 'supermart_categories',
    BILLS: 'supermart_bills',
    SUPPLIERS: 'supermart_suppliers',
    PURCHASES: 'supermart_purchases',
    USERS: 'supermart_users',
    SETTINGS: 'supermart_settings',
    HELD_BILLS: 'supermart_held_bills',
    INITIALIZED: 'supermart_initialized'
};

// Default Store Configuration
const DEFAULT_SETTINGS = {
    storeName: 'SuperMart',
    tagline: 'Smart Shopping, Better Life',
    branch: 'Main Branch, Chattogram',
    phone: '+880 1819-000000',
    email: 'contact@supermart.com.bd',
    currency: '৳',
    currencyCode: 'BDT',
    vatRate: 5, // 5%
    receiptFooter: 'Thank you for shopping with us! Please come again.',
    soundEnabled: true
};

// Initial Seed Products (~20 realistic supermarket products in Bangladesh)
const INITIAL_PRODUCTS = [
    {
        id: 'PRD-100001',
        barcode: '100001',
        name: 'Premium Miniket Rice (1kg)',
        shortName: 'Rice (1kg)',
        category: 'Groceries',
        costPrice: 48,
        sellingPrice: 60,
        stock: 85,
        reorderLevel: 20,
        unit: 'kg',
        emoji: '🌾',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100002',
        barcode: '100002',
        name: 'Fresh Pasteurized Milk (1L)',
        shortName: 'Milk (1L)',
        category: 'Dairy & Eggs',
        costPrice: 68,
        sellingPrice: 80,
        stock: 42,
        reorderLevel: 15,
        unit: 'ltr',
        emoji: '🥛',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100003',
        barcode: '100003',
        name: 'Farm Fresh Brown Eggs (Dozen)',
        shortName: 'Eggs (Dozen)',
        category: 'Dairy & Eggs',
        costPrice: 115,
        sellingPrice: 140,
        stock: 35,
        reorderLevel: 10,
        unit: 'box',
        emoji: '🥚',
        image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100004',
        barcode: '100004',
        name: 'Lifebuoy Total Soap Bar (100g)',
        shortName: 'Soap Bar',
        category: 'Personal Care',
        costPrice: 32,
        sellingPrice: 40,
        stock: 64,
        reorderLevel: 15,
        unit: 'pcs',
        emoji: '🧼',
        image: 'https://images.unsplash.com/photo-1607006314845-a74421115b02?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100005',
        barcode: '100005',
        name: 'Marie Light Biscuits (300g)',
        shortName: 'Biscuits (300g)',
        category: 'Snacks & Bakery',
        costPrice: 22,
        sellingPrice: 30,
        stock: 50,
        reorderLevel: 15,
        unit: 'pkt',
        emoji: '🍪',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100006',
        barcode: '100006',
        name: 'Rupchanda Fortified Soybean Oil (1L)',
        shortName: 'Soybean Oil (1L)',
        category: 'Groceries',
        costPrice: 155,
        sellingPrice: 180,
        stock: 38,
        reorderLevel: 12,
        unit: 'ltr',
        emoji: '🍾',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100007',
        barcode: '100007',
        name: 'ACI Pure Refined Salt (1kg)',
        shortName: 'Refined Salt 1kg',
        category: 'Groceries',
        costPrice: 28,
        sellingPrice: 38,
        stock: 90,
        reorderLevel: 25,
        unit: 'kg',
        emoji: '🧂',
        image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100008',
        barcode: '100008',
        name: 'Fresh White Sugar (1kg)',
        shortName: 'White Sugar 1kg',
        category: 'Groceries',
        costPrice: 110,
        sellingPrice: 130,
        stock: 75,
        reorderLevel: 20,
        unit: 'kg',
        emoji: '🍬',
        image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100009',
        barcode: '100009',
        name: 'Red Lentils / Masoor Dal (1kg)',
        shortName: 'Masoor Dal 1kg',
        category: 'Groceries',
        costPrice: 118,
        sellingPrice: 140,
        stock: 45,
        reorderLevel: 15,
        unit: 'kg',
        emoji: '🥣',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100010',
        barcode: '100010',
        name: 'Ispahani Mirzapore Tea (400g)',
        shortName: 'Tea (400g)',
        category: 'Beverages',
        costPrice: 185,
        sellingPrice: 220,
        stock: 30,
        reorderLevel: 10,
        unit: 'box',
        emoji: '☕',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100011',
        barcode: '100011',
        name: 'Maggi 2-Minute Noodles (Pack of 8)',
        shortName: 'Maggi Noodles 8pk',
        category: 'Snacks & Bakery',
        costPrice: 140,
        sellingPrice: 165,
        stock: 55,
        reorderLevel: 15,
        unit: 'pkt',
        emoji: '🍜',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100012',
        barcode: '100012',
        name: 'Kinley Drinking Water (1.5L)',
        shortName: 'Mineral Water 1.5L',
        category: 'Beverages',
        costPrice: 22,
        sellingPrice: 30,
        stock: 120,
        reorderLevel: 30,
        unit: 'bot',
        emoji: '💧',
        image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100013',
        barcode: '100013',
        name: 'Coca-Cola PET Bottle (500ml)',
        shortName: 'Coca-Cola 500ml',
        category: 'Beverages',
        costPrice: 38,
        sellingPrice: 45,
        stock: 60,
        reorderLevel: 20,
        unit: 'bot',
        emoji: '🥤',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100014',
        barcode: '100014',
        name: 'Pepsodent Cavity Protection (140g)',
        shortName: 'Pepsodent (140g)',
        category: 'Personal Care',
        costPrice: 95,
        sellingPrice: 120,
        stock: 8, // Low stock demo!
        reorderLevel: 15,
        unit: 'tube',
        emoji: '🪥',
        image: 'https://images.unsplash.com/photo-1559591937-e1032397e44c?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100015',
        barcode: '100015',
        name: 'Sunsilk Black Shine Shampoo (180ml)',
        shortName: 'Sunsilk (180ml)',
        category: 'Personal Care',
        costPrice: 175,
        sellingPrice: 210,
        stock: 5, // Low stock demo!
        reorderLevel: 12,
        unit: 'bot',
        emoji: '🧴',
        image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100016',
        barcode: '100016',
        name: 'Wheel 2in1 Washing Powder (1kg)',
        shortName: 'Wheel Powder 1kg',
        category: 'Household',
        costPrice: 110,
        sellingPrice: 135,
        stock: 28,
        reorderLevel: 10,
        unit: 'pkt',
        emoji: '🧺',
        image: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100017',
        barcode: '100017',
        name: 'Vim Dishwash Liquid (500ml)',
        shortName: 'Vim Liquid 500ml',
        category: 'Household',
        costPrice: 112,
        sellingPrice: 135,
        stock: 4, // Low stock demo!
        reorderLevel: 12,
        unit: 'bot',
        emoji: '🧽',
        image: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100018',
        barcode: '100018',
        name: 'Lays Classic Potato Chips (50g)',
        shortName: 'Lays Chips 50g',
        category: 'Snacks & Bakery',
        costPrice: 38,
        sellingPrice: 50,
        stock: 65,
        reorderLevel: 20,
        unit: 'pkt',
        emoji: '🥔',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100019',
        barcode: '100019',
        name: 'Fresh Atta / Whole Wheat Flour (2kg)',
        shortName: 'Atta Flour 2kg',
        category: 'Groceries',
        costPrice: 105,
        sellingPrice: 125,
        stock: 40,
        reorderLevel: 15,
        unit: 'pkt',
        emoji: '🍞',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80'
    },
    {
        id: 'PRD-100020',
        barcode: '100020',
        name: 'Savlon Antiseptic Hand Sanitizer (100ml)',
        shortName: 'Hand Sanitizer 100ml',
        category: 'Personal Care',
        costPrice: 65,
        sellingPrice: 85,
        stock: 3, // Low stock demo!
        reorderLevel: 10,
        unit: 'bot',
        emoji: '🧴',
        image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=120&auto=format&fit=crop&q=80'
    }
];

// Initial Categories
const INITIAL_CATEGORIES = [
    { id: 'CAT-1', name: 'Groceries', icon: 'fa-wheat-awn', count: 6 },
    { id: 'CAT-2', name: 'Dairy & Eggs', icon: 'fa-egg', count: 2 },
    { id: 'CAT-3', name: 'Snacks & Bakery', icon: 'fa-cookie-bite', count: 3 },
    { id: 'CAT-4', name: 'Personal Care', icon: 'fa-pump-soap', count: 4 },
    { id: 'CAT-5', name: 'Beverages', icon: 'fa-bottle-water', count: 3 },
    { id: 'CAT-6', name: 'Household', icon: 'fa-spray-can-sparkles', count: 2 }
];

// Initial Suppliers
const INITIAL_SUPPLIERS = [
    { id: 'SUP-01', name: 'Square Consumer Products Ltd', contact: 'Tanvir Hossain', phone: '+880 1711-234567', email: 'sales@square-consumer.com', address: 'Uttara, Dhaka' },
    { id: 'SUP-02', name: 'Pran-RFL Group', contact: 'Mahmudul Hasan', phone: '+880 1812-345678', email: 'distribution@pranrfl.com', address: 'Badda, Dhaka' },
    { id: 'SUP-03', name: 'ACI Consumer Goods', contact: 'Nasir Uddin', phone: '+880 1913-456789', email: 'orders@aci-bd.com', address: 'Tejgaon, Dhaka' },
    { id: 'SUP-04', name: 'Unilever Bangladesh', contact: 'Arif Ahmed', phone: '+880 1614-567890', email: 'connect@unileverbd.com', address: 'Gulshan, Dhaka' },
    { id: 'SUP-05', name: 'Meghna Group of Industries', contact: 'Kazi Farhan', phone: '+880 1715-678901', email: 'fresh@mgi.org', address: 'Motijheel, Dhaka' }
];

// Initial System Staff / Users
const INITIAL_USERS = [
    { id: 'USR-01', username: 'admin', name: 'Jawad Siddik', role: 'admin', roleTitle: 'System Admin', branch: 'Main Branch, Chattogram', status: 'Active' },
    { id: 'USR-02', username: 'cashier', name: 'Jawad Siddik', role: 'cashier', roleTitle: 'Senior Cashier', branch: 'Main Branch, Chattogram', status: 'Active' },
    { id: 'USR-03', username: 'cashier2', name: 'Fatima Akter', role: 'cashier', roleTitle: 'Shift Cashier', branch: 'Main Branch, Chattogram', status: 'Active' }
];

// Helper to generate dates relative to today
function getDateOffset(daysAgo, hour = 12, min = 30) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
}

// Generate realistic seeded past bills for dashboard charts and KPI statistics
function generateSeedBills() {
    return [
        {
            id: 'BILL-100241',
            billNo: '26011082417',
            date: getDateOffset(0, 11, 15),
            cashierUsername: 'cashier',
            cashierName: 'Jawad Siddik',
            branch: 'Main Branch, Chattogram',
            paymentMethod: 'Cash',
            items: [
                { barcode: '100001', name: 'Rice (1kg)', price: 60, cost: 48, qty: 2, total: 120 },
                { barcode: '100002', name: 'Milk (1L)', price: 80, cost: 68, qty: 1, total: 80 },
                { barcode: '100003', name: 'Eggs (Dozen)', price: 140, cost: 115, qty: 1, total: 140 },
                { barcode: '100004', name: 'Soap Bar', price: 40, cost: 32, qty: 1, total: 40 },
                { barcode: '100005', name: 'Biscuits (300g)', price: 30, cost: 22, qty: 2, total: 60 },
                { barcode: '100006', name: 'Soybean Oil (1L)', price: 160, cost: 155, qty: 1, total: 160 }
            ],
            subtotal: 600,
            discount: 0,
            vatRate: 5,
            vatAmount: 30,
            grandTotal: 630,
            amountReceived: 650,
            changeDue: 20
        },
        {
            id: 'BILL-100240',
            billNo: '26011082416',
            date: getDateOffset(0, 14, 20),
            cashierUsername: 'cashier',
            cashierName: 'Jawad Siddik',
            branch: 'Main Branch, Chattogram',
            paymentMethod: 'bKash',
            items: [
                { barcode: '100006', name: 'Soybean Oil (1L)', price: 180, cost: 155, qty: 2, total: 360 },
                { barcode: '100008', name: 'White Sugar 1kg', price: 130, cost: 110, qty: 2, total: 260 },
                { barcode: '100010', name: 'Tea (400g)', price: 220, cost: 185, qty: 1, total: 220 }
            ],
            subtotal: 840,
            discount: 40,
            vatRate: 5,
            vatAmount: 40,
            grandTotal: 840,
            amountReceived: 840,
            changeDue: 0
        },
        {
            id: 'BILL-100239',
            billNo: '26011082415',
            date: getDateOffset(0, 16, 45),
            cashierUsername: 'cashier2',
            cashierName: 'Fatima Akter',
            branch: 'Main Branch, Chattogram',
            paymentMethod: 'Card',
            items: [
                { barcode: '100011', name: 'Maggi Noodles 8pk', price: 165, cost: 140, qty: 2, total: 330 },
                { barcode: '100013', name: 'Coca-Cola 500ml', price: 45, cost: 38, qty: 4, total: 180 },
                { barcode: '100018', name: 'Lays Chips 50g', price: 50, cost: 38, qty: 3, total: 150 }
            ],
            subtotal: 660,
            discount: 0,
            vatRate: 5,
            vatAmount: 33,
            grandTotal: 693,
            amountReceived: 700,
            changeDue: 7
        },
        {
            id: 'BILL-100238',
            billNo: '26011082414',
            date: getDateOffset(1, 10, 30),
            cashierUsername: 'cashier',
            cashierName: 'Jawad Siddik',
            branch: 'Main Branch, Chattogram',
            paymentMethod: 'Cash',
            items: [
                { barcode: '100001', name: 'Rice (1kg)', price: 60, cost: 48, qty: 5, total: 300 },
                { barcode: '100009', name: 'Masoor Dal 1kg', price: 140, cost: 118, qty: 2, total: 280 },
                { barcode: '100007', name: 'Refined Salt 1kg', price: 38, cost: 28, qty: 1, total: 38 }
            ],
            subtotal: 618,
            discount: 18,
            vatRate: 5,
            vatAmount: 30,
            grandTotal: 630,
            amountReceived: 1000,
            changeDue: 370
        },
        {
            id: 'BILL-100237',
            billNo: '26011082413',
            date: getDateOffset(2, 17, 10),
            cashierUsername: 'cashier2',
            cashierName: 'Fatima Akter',
            branch: 'Main Branch, Chattogram',
            paymentMethod: 'bKash',
            items: [
                { barcode: '100015', name: 'Sunsilk (180ml)', price: 210, cost: 175, qty: 1, total: 210 },
                { barcode: '100016', name: 'Wheel Powder 1kg', price: 135, cost: 110, qty: 1, total: 135 },
                { barcode: '100017', name: 'Vim Liquid 500ml', price: 135, cost: 112, qty: 1, total: 135 }
            ],
            subtotal: 480,
            discount: 0,
            vatRate: 5,
            vatAmount: 24,
            grandTotal: 504,
            amountReceived: 504,
            changeDue: 0
        },
        {
            id: 'BILL-100236',
            billNo: '26011082412',
            date: getDateOffset(3, 13, 50),
            cashierUsername: 'cashier',
            cashierName: 'Jawad Siddik',
            branch: 'Main Branch, Chattogram',
            paymentMethod: 'Cash',
            items: [
                { barcode: '100002', name: 'Milk (1L)', price: 80, cost: 68, qty: 3, total: 240 },
                { barcode: '100005', name: 'Biscuits (300g)', price: 30, cost: 22, qty: 4, total: 120 }
            ],
            subtotal: 360,
            discount: 0,
            vatRate: 5,
            vatAmount: 18,
            grandTotal: 378,
            amountReceived: 400,
            changeDue: 22
        },
        {
            id: 'BILL-100235',
            billNo: '26011082411',
            date: getDateOffset(4, 18, 0),
            cashierUsername: 'cashier',
            cashierName: 'Jawad Siddik',
            branch: 'Main Branch, Chattogram',
            paymentMethod: 'Card',
            items: [
                { barcode: '100006', name: 'Soybean Oil (1L)', price: 180, cost: 155, qty: 3, total: 540 },
                { barcode: '100019', name: 'Atta Flour 2kg', price: 125, cost: 105, qty: 2, total: 250 },
                { barcode: '100003', name: 'Eggs (Dozen)', price: 140, cost: 115, qty: 1, total: 140 }
            ],
            subtotal: 930,
            discount: 30,
            vatRate: 5,
            vatAmount: 45,
            grandTotal: 945,
            amountReceived: 945,
            changeDue: 0
        },
        {
            id: 'BILL-100234',
            billNo: '26011082410',
            date: getDateOffset(5, 12, 10),
            cashierUsername: 'cashier2',
            cashierName: 'Fatima Akter',
            branch: 'Main Branch, Chattogram',
            paymentMethod: 'Cash',
            items: [
                { barcode: '100014', name: 'Pepsodent (140g)', price: 120, cost: 95, qty: 2, total: 240 },
                { barcode: '100004', name: 'Soap Bar', price: 40, cost: 32, qty: 3, total: 120 }
            ],
            subtotal: 360,
            discount: 0,
            vatRate: 5,
            vatAmount: 18,
            grandTotal: 378,
            amountReceived: 500,
            changeDue: 122
        },
        {
            id: 'BILL-100233',
            billNo: '26011082409',
            date: getDateOffset(6, 15, 30),
            cashierUsername: 'cashier',
            cashierName: 'Jawad Siddik',
            branch: 'Main Branch, Chattogram',
            paymentMethod: 'bKash',
            items: [
                { barcode: '100001', name: 'Rice (1kg)', price: 60, cost: 48, qty: 10, total: 600 },
                { barcode: '100006', name: 'Soybean Oil (1L)', price: 180, cost: 155, qty: 2, total: 360 }
            ],
            subtotal: 960,
            discount: 50,
            vatRate: 5,
            vatAmount: 45.5,
            grandTotal: 955.5,
            amountReceived: 955.5,
            changeDue: 0
        }
    ];
}

// Initial Purchases / Stock-ins
const INITIAL_PURCHASES = [
    {
        id: 'PO-2026-089',
        supplier: 'Square Consumer Products Ltd',
        date: getDateOffset(2, 9, 30),
        items: 'Wheel Washing Powder, Vim Liquid, Savlon',
        totalCost: 14200,
        status: 'Received',
        notes: 'Monthly cleaning supplies replenishment'
    },
    {
        id: 'PO-2026-088',
        supplier: 'Pran-RFL Group',
        date: getDateOffset(4, 11, 0),
        items: 'Fresh Milk, Marie Biscuits, Maggi Noodles',
        totalCost: 28500,
        status: 'Received',
        notes: 'Dairy & snack restock'
    },
    {
        id: 'PO-2026-087',
        supplier: 'Meghna Group of Industries',
        date: getDateOffset(7, 14, 15),
        items: 'Rupchanda Soybean Oil, Pure Salt, Sugar',
        totalCost: 45000,
        status: 'Received',
        notes: 'Main grocery commodities restock'
    }
];

// Database Controller
const DB = {
    // Initialize or re-seed database
    init(force = false) {
        if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED) || force) {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
            localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
            localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(generateSeedBills()));
            localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(INITIAL_PURCHASES));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
            localStorage.setItem(STORAGE_KEYS.HELD_BILLS, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
            console.log('SuperMart LocalStorage initialized with demo data.');
        }
    },

    // Reset database back to default seed
    reset() {
        this.init(true);
    },

    // Products
    getProducts() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [];
        } catch (e) {
            return [];
        }
    },

    getProductByBarcode(barcode) {
        const products = this.getProducts();
        return products.find(p => String(p.barcode).trim() === String(barcode).trim());
    },

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    },

    saveProduct(product) {
        const products = this.getProducts();
        const existingIndex = products.findIndex(p => p.id === product.id || String(p.barcode) === String(product.barcode));
        
        if (existingIndex > -1) {
            products[existingIndex] = { ...products[existingIndex], ...product };
        } else {
            product.id = product.id || 'PRD-' + Date.now().toString().slice(-6);
            products.unshift(product);
        }
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        this.updateCategoryCounts();
        return product;
    },

    deleteProduct(id) {
        const products = this.getProducts().filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        this.updateCategoryCounts();
    },

    // Adjust stock (decrease when sold, increase when stocked in)
    adjustProductStock(barcode, quantityChange) {
        const products = this.getProducts();
        const product = products.find(p => String(p.barcode) === String(barcode));
        if (product) {
            product.stock = Math.max(0, (product.stock || 0) + quantityChange);
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
            return product;
        }
        return null;
    },

    // Categories
    getCategories() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || [];
        } catch (e) {
            return [];
        }
    },

    saveCategory(cat) {
        const cats = this.getCategories();
        const idx = cats.findIndex(c => c.name.toLowerCase() === cat.name.toLowerCase());
        if (idx > -1) {
            cats[idx] = { ...cats[idx], ...cat };
        } else {
            cat.id = cat.id || 'CAT-' + (cats.length + 1);
            cats.push(cat);
        }
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
        return cat;
    },

    deleteCategory(id) {
        const cats = this.getCategories().filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    },

    updateCategoryCounts() {
        const products = this.getProducts();
        const categories = this.getCategories();
        categories.forEach(cat => {
            cat.count = products.filter(p => p.category === cat.name).length;
        });
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    },

    // Bills / Sales
    getBills() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS)) || [];
        } catch (e) {
            return [];
        }
    },

    saveBill(bill) {
        const bills = this.getBills();
        bills.unshift(bill);
        localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));

        // Deduct product stocks
        if (bill.items && Array.isArray(bill.items)) {
            bill.items.forEach(item => {
                this.adjustProductStock(item.barcode, -Number(item.qty));
            });
        }
        return bill;
    },

    getBillById(billId) {
        const bills = this.getBills();
        return bills.find(b => b.id === billId || b.billNo === billId);
    },

    // Held Bills (Hold / Resume for Cashier)
    getHeldBills() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.HELD_BILLS)) || [];
        } catch (e) {
            return [];
        }
    },

    saveHeldBill(heldBill) {
        const held = this.getHeldBills();
        held.unshift(heldBill);
        localStorage.setItem(STORAGE_KEYS.HELD_BILLS, JSON.stringify(held));
        return held;
    },

    removeHeldBill(heldId) {
        const held = this.getHeldBills().filter(h => h.id !== heldId);
        localStorage.setItem(STORAGE_KEYS.HELD_BILLS, JSON.stringify(held));
        return held;
    },

    // Suppliers
    getSuppliers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) || [];
        } catch (e) {
            return [];
        }
    },

    saveSupplier(sup) {
        const sups = this.getSuppliers();
        const idx = sups.findIndex(s => s.id === sup.id);
        if (idx > -1) {
            sups[idx] = { ...sups[idx], ...sup };
        } else {
            sup.id = sup.id || 'SUP-' + (sups.length + 1).toString().padStart(2, '0');
            sups.push(sup);
        }
        localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(sups));
        return sup;
    },

    deleteSupplier(id) {
        const sups = this.getSuppliers().filter(s => s.id !== id);
        localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(sups));
    },

    // Purchases / Stock In Orders
    getPurchases() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES)) || [];
        } catch (e) {
            return [];
        }
    },

    savePurchase(po) {
        const pos = this.getPurchases();
        pos.unshift(po);
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(pos));
        return po;
    },

    // Users / Staff
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
        } catch (e) {
            return [];
        }
    },

    saveUser(user) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.username === user.username);
        if (idx > -1) {
            users[idx] = { ...users[idx], ...user };
        } else {
            user.id = user.id || 'USR-' + (users.length + 1).toString().padStart(2, '0');
            users.push(user);
        }
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return user;
    },

    deleteUser(id) {
        const users = this.getUsers().filter(u => u.id !== id && u.username !== 'admin');
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    },

    // Settings
    getSettings() {
        try {
            return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {}) };
        } catch (e) {
            return DEFAULT_SETTINGS;
        }
    },

    saveSettings(newSettings) {
        const current = this.getSettings();
        const updated = { ...current, ...newSettings };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        return updated;
    }
};

// Auto initialize on load
DB.init();

