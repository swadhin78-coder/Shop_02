// --- 1. Global State and Initial Data ---
const OWNER_PASSWORD = "123"; // 🔑 Owner Password
let products = [];
let cart = [];
let sales = []; // ✨ NEW: Array to store sales data
let slideIndex = 0;

// Get references to key DOM elements
const sideMenu = document.getElementById('sideMenu');
const ownerPanelSection = document.getElementById('ownerPanelSection');
const productList = document.getElementById('productList');
const invoiceDetails = document.getElementById('invoiceDetails');
const totalItemsSpan = document.getElementById('totalItems');
const grandTotalSpan = document.getElementById('grandTotal');

// --- 2. Utility Functions ---

/** Loads data from Local Storage or uses default data */
function loadInitialData() {
    const storedProducts = localStorage.getItem('swadhinShopProducts');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    } else {
        // Default data for first run
        products = [
            { id: 1, name: "Basmati Rice (1kg)", price: 120, qty: 50 },
            { id: 2, name: "Refined Sugar (500g)", price: 55, qty: 100 },
            { id: 3, name: "Cooking Oil (1L)", price: 180, qty: 30 },
            { id: 4, name: "Fresh Milk (1L)", price: 70, qty: 45 },
            { id: 5, name: "Masala Powder (100g)", price: 65, qty: 75 }
        ];
        saveProducts();
    }
    
    // ✨ NEW: Load sales data
    loadSalesData(); 
}

/** Saves product data to Local Storage */
function saveProducts() {
    localStorage.setItem('swadhinShopProducts', JSON.stringify(products));
}

/** ✨ NEW: Loads sales data from Local Storage */
function loadSalesData() {
    const storedSales = localStorage.getItem('swadhinShopSales');
    if (storedSales) {
        sales = JSON.parse(storedSales);
    } else {
        sales = [];
    }
}

/** ✨ NEW: Saves sales data to Local Storage */
function saveSales() {
    localStorage.setItem('swadhinShopSales', JSON.stringify(sales));
    // Optional: Log sales data to console for owner check
    console.log("Total Sales Transactions:", sales.length, sales); 
}


// --- 3. Sidebar and Login Functionality ---

/** Toggles the side menu visibility */
function toggleMenu() {
    sideMenu.classList.toggle('active');
}

/** Checks owner password and toggles the owner panel (MODIFIED) */
function checkLogin() {
    const ownerPassInput = document.getElementById('ownerPass').value;
    if (ownerPassInput === OWNER_PASSWORD) {
        ownerPanelSection.classList.add('active');
        // Show total sales data count on successful login
        alert(`Login Successful! Owner Panel is now visible. (Total Sales Saved: ${sales.length})`);
        document.getElementById('ownerPass').value = ''; // Clear password
        toggleMenu(); // Close sidebar after login
    } else {
        alert("Login Failed. Incorrect Password.");
    }
}


// --- 4. Product Management (Owner Panel) ---

/** Adds a new product or updates an existing one */
function addProduct() {
    const name = document.getElementById('newName').value.trim();
    const price = parseFloat(document.getElementById('newPrice').value);
    const qty = parseInt(document.getElementById('newQty').value);

    if (!name || isNaN(price) || isNaN(qty) || price <= 0 || qty < 0) {
        alert("Please enter valid product name, price, and quantity.");
        return;
    }

    // Check if product already exists (update)
    const existingProduct = products.find(p => p.name.toLowerCase() === name.toLowerCase());

    if (existingProduct) {
        // Update product
        existingProduct.price = price;
        existingProduct.qty = qty;
        alert(`${name} updated! Price: ${price} Tk, Stock: ${qty}`);
    } else {
        // Add new product
        const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, price, qty });
        alert(`${name} added to the product list.`);
    }

    // Clear inputs and refresh display
    document.getElementById('newName').value = '';
    document.getElementById('newPrice').value = '';
    document.getElementById('newQty').value = '';
    
    saveProducts();
    renderProducts();
}

/** ✨ NEW: Deletes a product from the list */
function deleteProduct() {
    const deleteNameInput = document.getElementById('deleteName');
    const productNameToDelete = deleteNameInput.value.trim();

    if (!productNameToDelete) {
        alert("Please enter the name of the product you want to delete.");
        return;
    }

    const initialLength = products.length;
    
    // Filter out the product to be deleted (case-insensitive)
    const updatedProducts = products.filter(product => 
        product.name.toLowerCase() !== productNameToDelete.toLowerCase()
    );

    if (updatedProducts.length === initialLength) {
        alert(`❌ Product "${productNameToDelete}" not found in the list. Check the spelling.`);
    } else {
        // Update the global products array and save
        products = updatedProducts;
        saveProducts(); 
        renderProducts(); // Update UI
        alert(`✅ Product "${productNameToDelete}" successfully deleted!`);
    }

    // Clear the input field
    deleteNameInput.value = '';
}


/** Renders all products in the main grid */
function renderProducts() {
    productList.innerHTML = ''; // Clear existing products

    if (products.length === 0) {
        productList.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No products available. Please add some from the Owner Panel.</p>';
        return;
    }

    products.forEach(product => {
        const stockStatus = product.qty > 0 ? `<span style="color: green;">In Stock: ${product.qty}</span>` : `<span style="color: red;">Out of Stock</span>`;
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <h3>${product.name}</h3>
            <p class="price">${product.price.toFixed(2)} Tk</p>
            <p class="stock">${stockStatus}</p>
            ${product.qty > 0 ? `
                <input type="number" id="qty-${product.id}" value="1" min="1" max="${product.qty}">
                <button class="btn btn-add-cart" onclick="addToCart(${product.id})">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
            ` : '<button class="btn" disabled>Out of Stock</button>'}
        `;
        productList.appendChild(productCard);
    });
}


// --- 5. Cart/Invoice Functionality ---

/** Adds a product to the cart */
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const qtyInput = document.getElementById(`qty-${productId}`);
    const orderQty = parseInt(qtyInput.value);

    if (!product || orderQty <= 0 || orderQty > product.qty) {
        alert("Invalid quantity or product is out of stock.");
        return;
    }

    const existingCartItem = cart.find(item => item.id === productId);

    if (existingCartItem) {
        const totalQty = existingCartItem.orderQty + orderQty;
        if (totalQty > product.qty) {
            alert(`Cannot add ${orderQty} more. Only ${product.qty - existingCartItem.orderQty} left in stock.`);
            return;
        }
        existingCartItem.orderQty = totalQty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            orderQty: orderQty
        });
    }
    
    // Reset quantity input to 1 after adding
    qtyInput.value = 1;

    renderCart();
    
    // Scroll to the order section
    document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
}

/** Renders the current cart details */
function renderCart() {
    invoiceDetails.innerHTML = '';
    let total = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        invoiceDetails.innerHTML = '<p class="empty-cart-message">Your cart is empty. Add products to generate invoice.</p>';
        totalItemsSpan.textContent = 0;
        grandTotalSpan.textContent = '0.00 Tk';
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.orderQty;
        total += itemTotal;
        totalItems += item.orderQty;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.innerHTML = `
            <div class="item-details">${item.name}</div>
            <div class="item-qty-price">
                ${item.orderQty} x ${item.price.toFixed(2)} = 
                <strong>${itemTotal.toFixed(2)} Tk</strong>
            </div>
            <button class="remove-item-btn" onclick="removeFromCart(${item.id})">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        invoiceDetails.appendChild(cartItemDiv);
    });

    totalItemsSpan.textContent = totalItems;
    grandTotalSpan.textContent = total.toFixed(2) + ' Tk';
}

/** Removes an item from the cart */
function removeFromCart(productId) {
    // Find the index of the cart item
    const index = cart.findIndex(item => item.id === productId);
    
    if (index !== -1) {
        // Remove 1 item from the cart array at that index
        cart.splice(index, 1);
        renderCart();
    }
}

/** Clears the entire cart */
function clearCart() {
    if (confirm("Are you sure you want to clear the entire cart?")) {
        cart = [];
        renderCart();
    }
}

/** Handles the final invoice print/sale transaction (MODIFIED FOR DATA SAVING) */
function printInvoice() {
    if (cart.length === 0) {
        alert("Cart is empty. Please add items before printing an invoice.");
        return;
    }

    const customerName = document.getElementById('custName').value.trim() || "Guest Customer";
    const custNumber = document.getElementById('custNumber').value.trim();
    const invoiceNo = Math.floor(Math.random() * 90000) + 10000; // 5-digit invoice number
    let grandTotalValue = 0;

    // 1. Update Product Stock and calculate total
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        const itemTotal = cartItem.price * cartItem.orderQty;
        grandTotalValue += itemTotal;

        if (product) {
            product.qty -= cartItem.orderQty; // Deduct sold quantity
        }
    });

    saveProducts(); // Save updated stock to Local Storage

    // 2. ✨ NEW: Save the entire sale transaction
    const saleData = {
        invoiceId: invoiceNo,
        date: new Date().toISOString(),
        customer: customerName,
        phone: custNumber,
        totalAmount: grandTotalValue.toFixed(2),
        items: cart.map(item => ({
            name: item.name,
            qty: item.orderQty,
            price: item.price
        }))
    };
    sales.push(saleData);
    saveSales(); // Save the updated sales history to Local Storage

    // 3. Prepare for printing (using a new window for better print control)
    const printWindow = window.open('', '', 'height=600,width=800');

    // Build the final print content
    let invoiceTableRows = '';
    cart.forEach(item => {
        const itemTotal = item.price * item.orderQty;
        invoiceTableRows += `
            <tr>
                <td>${item.name}</td>
                <td style="text-align: right;">${item.orderQty}</td>
                <td style="text-align: right;">${item.price.toFixed(2)}</td>
                <td style="text-align: right;">${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    });

    printWindow.document.write(`
        <html><head><title>Swadhin Shop Invoice</title>
        <style>
            body { font-family: 'Poppins', sans-serif; padding: 20px; line-height: 1.6; }
            .invoice-box { max-width: 600px; margin: auto; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 14px; line-height: 24px; color: #555; }
            .invoice-header { background: #1e88e5; color: white; padding: 10px; text-align: center; }
            .customer-info-print { margin: 15px 0; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .invoice-table th, .invoice-table td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
            .invoice-table th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; border-top: 2px solid #333; }
            .footer-print { text-align: center; margin-top: 20px; font-size: 12px; }
        </style></head><body>
        
        <div class="invoice-box">
            <div class="invoice-header">
                <h2>Swadhin's Shop - Sales Invoice</h2>
                <p>Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}</p>
            </div>
            
            <div style="padding: 20px;">
                <div class="customer-info-print">
                    <p><strong>Customer:</strong> ${customerName}</p>
                    ${custNumber ? `<p><strong>Phone:</strong> ${custNumber}</p>` : ''}
                    <p><strong>Invoice No:</strong> ${invoiceNo}</p>
                </div>

                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: right;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoiceTableRows}
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;">GRAND TOTAL</td>
                            <td style="text-align: right;">${grandTotalValue.toFixed(2)} Tk</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="footer-print">
                    <p>Thank you for shopping at Swadhin's Shop!</p>
                    <p>Please come again.</p>
                </div>
            </div>
        </div></body></html>
    `);
    
    printWindow.document.close();
    printWindow.print();

    // 4. Final cleanup after sale
    cart = []; // Empty the cart
    document.getElementById('custName').value = '';
    document.getElementById('custNumber').value = '';
    renderCart(); // Update UI
    renderProducts(); // Update product stock on UI
}


// --- 6. Slider Functionality ---

/** Show a specific slide */
function showSlides(n) {
    // Note: The autoSlideshow function handles the main slider logic with fade effect. 
    // This function is kept for manual dot navigation but might be simplified/replaced by autoSlideshow logic.
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (slides.length === 0) return;

    // Handle loop (next/prev logic)
    if (n >= slides.length) { slideIndex = 0 } // স্লাইড লুপ নিশ্চিত
    if (n < 0) { slideIndex = slides.length - 1 }
    
    // Clear 'active' class from all
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active-dot'));

    // Set 'active' class on current
    slides[slideIndex].classList.add('active');
    dots[slideIndex].classList.add('active-dot');
}

// Function to handle the automatic slideshow
function autoSlideshow() {
    let currentSlideIndex = 0; 
    const slides = document.querySelectorAll(".slide");
    const dotsContainer = document.querySelector(".dot-navigation");
    
    // --- Create Dots Dynamically ---
    dotsContainer.innerHTML = ''; // Clear existing dots to prevent duplication
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.addEventListener('click', () => {
            currentSlideIndex = index;
            manualSlide(currentSlideIndex);
        });
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll(".dot");

    // --- Main Slide Show Logic (Auto-cycling) ---
    function cycleSlides() {
        // Remove 'active' class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active-dot'));

        // Increment index, and loop back to 0 if it exceeds the number of slides
        currentSlideIndex++;
        if (currentSlideIndex > slides.length) {
            currentSlideIndex = 1; 
        }

        // Add 'active' class to the current slide and dot
        slides[currentSlideIndex - 1].classList.add('active');
        dots[currentSlideIndex - 1].classList.add('active-dot');

        // Set the timer for the next slide (4 seconds)
        setTimeout(cycleSlides, 4000); 
    }

    // Function to manually jump to a specific slide (from dot click)
    function manualSlide(n) {
        currentSlideIndex = n + 1; // Set internal index to pick up correctly on next cycle
        
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active-dot'));
        
        slides[n].classList.add('active');
        dots[n].classList.add('active-dot');
    }

    // Start the automatic cycle
    cycleSlides();
}


// --- 7. Theme Functionality (No changes needed) ---

/** Toggles between light and dark theme */
function toggleTheme() {
    // Toggles the 'dark-theme' class on the body
    const isDarkMode = document.body.classList.toggle('dark-theme');
    const themeToggle = document.getElementById('themeToggle');
    
    // Save preference to local storage
    localStorage.setItem('swadhinShopTheme', isDarkMode ? 'dark' : 'light');

    // Update checkbox state
    themeToggle.checked = isDarkMode;
}

/** Loads the user's preferred theme from local storage */
function loadTheme() {
    const savedTheme = localStorage.getItem('swadhinShopTheme');
    const themeToggle = document.getElementById('themeToggle');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if(themeToggle) themeToggle.checked = true; // Set toggle switch to ON
    } else {
        document.body.classList.remove('dark-theme');
        if(themeToggle) themeToggle.checked = false; // Set toggle switch to OFF
    }
}


// --- 8. Initialization ---

/** Runs on page load */
window.onload = function() {
    loadInitialData(); // Load products and sales from storage
    renderProducts();  // Display products
    renderCart();      // Display empty cart initially

    loadTheme();       // Load user's theme preference

    // Replaced manual dot creation with autoSlideshow which handles it
    autoSlideshow();       // Start automatic slide show and create dots
};