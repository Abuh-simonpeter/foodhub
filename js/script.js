// ===============================
// CART STORAGE HELPERS
// ===============================
function getCart() {
    const raw = JSON.parse(localStorage.getItem("cart")) || [];
    return raw.map(function (item) {
        return {
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity) || 1
        };
    });
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function getCartTotal(cart) {
    return cart.reduce(function (sum, item) {
        return sum + item.price * item.quantity;
    }, 0);
}

// ===============================
// CART COUNT BADGE
// ===============================
function updateCartCount() {
    const cartLink = document.querySelector('a[href="cart.html"]');
    if (!cartLink) return;

    const oldCount = cartLink.querySelector(".cart-count");
    if (oldCount) oldCount.remove();

    const cart = getCart();
    const totalItems = cart.reduce(function (sum, item) {
        return sum + item.quantity;
    }, 0);

    const badge = document.createElement("span");
    badge.className = "cart-count";
    badge.textContent = totalItems;
    cartLink.appendChild(badge);
}

// ===============================
// MAIN
// ===============================
document.addEventListener("DOMContentLoaded", function () {

    // ---- Mobile nav toggle ----
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function () {
            navLinks.classList.toggle("show");
        });
    }

    // ---- Add to cart (menu page) ----
    document.querySelectorAll(".add-to-cart").forEach(function (button) {
        button.addEventListener("click", function () {
            const name = button.dataset.name;
            const price = Number(button.dataset.price);
            const cart = getCart();

            const existing = cart.find(function (item) {
                return item.name === name;
            });

            if (existing) {
                existing.quantity++;
            } else {
                cart.push({ name: name, price: price, quantity: 1 });
            }

            saveCart(cart);
            updateCartCount();

            const original = button.textContent;
            button.textContent = "Added ✓";
            setTimeout(function () {
                button.textContent = original;
            }, 1000);
        });
    });

    // ---- Cart page rendering ----
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");

    function displayCart() {
        if (!cartItems || !cartTotal) return;

        const cart = getCart();
        cartItems.innerHTML = "";

        if (cart.length === 0) {
            cartItems.innerHTML = "<p>Your cart is empty.</p>";
        } else {
            cart.forEach(function (food, index) {
                const subtotal = food.price * food.quantity;
                const item = document.createElement("div");
                item.className = "cart-item";
                item.innerHTML = `
                    <div>
                        <h3>${food.name}</h3>
                        <p>₦${food.price.toLocaleString()} each</p>
                        <p>Subtotal: ₦${subtotal.toLocaleString()}</p>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-minus" data-index="${index}">−</button>
                        <span>${food.quantity}</span>
                        <button class="quantity-plus" data-index="${index}">+</button>
                    </div>
                    <button class="remove-item" data-index="${index}">Remove</button>
                `;
                cartItems.appendChild(item);
            });
        }

        cartTotal.textContent =
            "Total: ₦" + getCartTotal(cart).toLocaleString();

        // Wire buttons after render
        cartItems.querySelectorAll(".quantity-plus").forEach(function (btn) {
            btn.addEventListener("click", function () {
                const cart = getCart();
                cart[Number(btn.dataset.index)].quantity++;
                saveCart(cart);
                displayCart();
                updateCartCount();
            });
        });

        cartItems.querySelectorAll(".quantity-minus").forEach(function (btn) {
            btn.addEventListener("click", function () {
                const cart = getCart();
                const i = Number(btn.dataset.index);
                if (cart[i].quantity > 1) {
                    cart[i].quantity--;
                } else {
                    cart.splice(i, 1);
                }
                saveCart(cart);
                displayCart();
                updateCartCount();
            });
        });

        cartItems.querySelectorAll(".remove-item").forEach(function (btn) {
            btn.addEventListener("click", function () {
                const cart = getCart();
                cart.splice(Number(btn.dataset.index), 1);
                saveCart(cart);
                displayCart();
                updateCartCount();
            });
        });
    }

    if (cartItems) displayCart();

    // ---- Clear cart ----
    const clearButton = document.getElementById("clear-cart");
    if (clearButton) {
        clearButton.addEventListener("click", function () {
            saveCart([]);
            if (cartItems) displayCart();
            updateCartCount();
        });
    }

    // ---- Checkout order summary ----
    const orderBox = document.getElementById("order");
    if (orderBox) {
        const cart = getCart();
        if (cart.length === 0) {
            orderBox.value = "Your cart is empty.";
        } else {
            let text = "";
            cart.forEach(function (food) {
                text += food.name + " x " + food.quantity +
                        " - ₦" + (food.price * food.quantity).toLocaleString() +
                        "\n";
            });
            text += "\nTOTAL: ₦" + getCartTotal(cart).toLocaleString();
            orderBox.value = text;
        }
    }

    // ---- Paystack payment (checkout page) ----
    const checkoutForm = document.querySelector(".checkout form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", function (event) {
            const paymentMethod = document.querySelector(
                'input[name="payment_method"]:checked'
            );

            if (!paymentMethod) {
                event.preventDefault();
                alert("Please select a payment method.");
                return;
            }

            // Cash on Delivery → let Formspree handle it
            if (paymentMethod.value === "Cash on Delivery") {
                saveCart([]);
                return;
            }

            // Online payment → Paystack
            event.preventDefault();

            const email = document.getElementById("email").value;
            const name = document.getElementById("customer-name").value;
            const phone = document.getElementById("phone").value;
            const orderText = document.getElementById("order").value;

            const totalMatch = orderText.match(/TOTAL:\s*₦([\d,]+)/);
            if (!totalMatch) {
                alert("Could not calculate the order total.");
                return;
            }

            const total = Number(totalMatch[1].replace(/,/g, ""));
            const amount = total * 100; // kobo

            const paystack = new PaystackPop();
            paystack.newTransaction({
                key: "pk_test_ae5ec5b6327880a0fdbd5ccd6056602760894089",
                email: email,
                amount: amount,
                currency: "NGN",
                firstName: name,
                phone: phone,
                metadata: {
                    customer_name: name,
                    phone: phone,
                    order: orderText
                },
                onSuccess: function (transaction) {
                    document.getElementById("payment-reference").value =
                        transaction.reference;
                    alert(
                        "Payment successful!\n\nReference: " +
                        transaction.reference
                    );
                    saveCart([]);
                    checkoutForm.submit();
                },
                onCancel: function () {
                    alert("Payment cancelled.");
                },
                onError: function (error) {
                    alert("Payment error: " + error.message);
                }
            });
        });
    }

    // ---- Initial badge ----
    updateCartCount();
});