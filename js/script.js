document.addEventListener("DOMContentLoaded", function () {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Convert old cart items to the new format
    cart = cart.map(function (item) {
        return {
            name: item.name,
            price: Number(item.price),
            quantity: item.quantity || 1
        };
    });

    localStorage.setItem("cart", JSON.stringify(cart));


    // =========================
    // CART NUMBER
    // =========================

    function updateCartCount() {

        const cartLink =
            document.querySelector('a[href="cart.html"]');

        if (!cartLink) return;

        let oldCount =
            cartLink.querySelector(".cart-count");

        if (oldCount) {
            oldCount.remove();
        }

        const count = document.createElement("span");

        count.className = "cart-count";

        // Number of individual food items
        let totalItems = 0;

        cart.forEach(function (item) {
            totalItems += item.quantity;
        });

        count.textContent = totalItems;

        cartLink.appendChild(count);
    }


    // =========================
    // ADD TO CART
    // =========================

    const addButtons =
        document.querySelectorAll(".add-to-cart");

    addButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const name = button.dataset.name;
            const price = Number(button.dataset.price);

            // Check if food already exists
            const existingItem = cart.find(function (item) {
                return item.name === name;
            });

            if (existingItem) {

                existingItem.quantity++;

            } else {

                cart.push({
                    name: name,
                    price: price,
                    quantity: 1
                });

            }

            localStorage.setItem(
                "cart",
                JSON.stringify(cart)
            );

            updateCartCount();

            alert(name + " added to cart!");

        });

    });


    // =========================
    // DISPLAY CART
    // =========================

    const cartItems =
        document.getElementById("cart-items");

    const cartTotal =
        document.getElementById("cart-total");


    if (cartItems && cartTotal) {

        function displayCart() {

            cartItems.innerHTML = "";

            let total = 0;

            if (cart.length === 0) {

                cartItems.innerHTML =
                    "<p>Your cart is empty.</p>";

            } else {

                cart.forEach(function (food, index) {

                    const subtotal =
                        food.price * food.quantity;

                    total += subtotal;

                    const item =
                        document.createElement("div");

                    item.className = "cart-item";

                    item.innerHTML = `
                        <div>
                            <h3>${food.name}</h3>

                            <p>
                                ₦${food.price.toLocaleString()}
                                each
                            </p>

                            <p>
                                Subtotal:
                                ₦${subtotal.toLocaleString()}
                            </p>
                        </div>

                        <div class="quantity-controls">

                            <button
                                class="quantity-minus"
                                data-index="${index}">
                                −
                            </button>

                            <span>
                                ${food.quantity}
                            </span>

                            <button
                                class="quantity-plus"
                                data-index="${index}">
                                +
                            </button>

                        </div>

                        <button
                            class="remove-item"
                            data-index="${index}">
                            Remove
                        </button>
                    `;

                    cartItems.appendChild(item);

                });

            }

            cartTotal.textContent =
                "Total: ₦" + total.toLocaleString();


            // =========================
            // PLUS BUTTON
            // =========================

            document
                .querySelectorAll(".quantity-plus")
                .forEach(function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const index =
                                Number(button.dataset.index);

                            cart[index].quantity++;

                            saveAndRefresh();

                        }
                    );

                });


            // =========================
            // MINUS BUTTON
            // =========================

            document
                .querySelectorAll(".quantity-minus")
                .forEach(function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const index =
                                Number(button.dataset.index);

                            if (cart[index].quantity > 1) {

                                cart[index].quantity--;

                            } else {

                                cart.splice(index, 1);

                            }

                            saveAndRefresh();

                        }
                    );

                });


            // =========================
            // REMOVE BUTTON
            // =========================

            document
                .querySelectorAll(".remove-item")
                .forEach(function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const index =
                                Number(button.dataset.index);

                            cart.splice(index, 1);

                            saveAndRefresh();

                        }
                    );

                });

        }


        function saveAndRefresh() {

            localStorage.setItem(
                "cart",
                JSON.stringify(cart)
            );

            displayCart();
            updateCartCount();

        }


        displayCart();

    }


    // =========================
    // CLEAR CART
    // =========================

    const clearButton =
        document.getElementById("clear-cart");

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                cart = [];

                localStorage.setItem(
                    "cart",
                    JSON.stringify(cart)
                );

                updateCartCount();

                if (cartItems && cartTotal) {

                    cartItems.innerHTML =
                        "<p>Your cart is empty.</p>";

                    cartTotal.textContent =
                        "Total: ₦0";

                }

            }
        );

    }


    // =========================
    // CHECKOUT ORDER
    // =========================

    const orderBox =
        document.getElementById("order");

    if (orderBox) {

        if (cart.length === 0) {

            orderBox.value =
                "Your cart is empty.";

        } else {

            let orderText = "";
            let total = 0;

            cart.forEach(function (food) {

                const subtotal =
                    food.price * food.quantity;

                total += subtotal;

                orderText +=
                    food.name +
                    " x " +
                    food.quantity +
                    " - ₦" +
                    subtotal.toLocaleString() +
                    "\n";

            });

            orderText +=
                "\nTOTAL: ₦" +
                total.toLocaleString();

            orderBox.value = orderText;

        }

    }


    // Initial count
    updateCartCount();

});
// ===============================
// PAYSTACK PAYMENT
// ===============================

const checkoutForm = document.querySelector(".checkout form");

if (checkoutForm) {

    checkoutForm.addEventListener("submit", function (event) {

        const paymentMethod =
            document.querySelector('input[name="payment_method"]:checked');

        // Make sure a payment method was selected
        if (!paymentMethod) {
            event.preventDefault();
            alert("Please select a payment method.");
            return;
        }

        // If Cash on Delivery, allow Formspree to submit normally
        if (paymentMethod.value === "Cash on Delivery") {
            return;
        }

        // Stop normal Formspree submission for online payment
        event.preventDefault();

        const email = document.getElementById("email").value;
        const name = document.getElementById("customer-name").value;
        const phone = document.getElementById("phone").value;

        // Get total from the order textarea
        const orderText = document.getElementById("order").value;

        const totalMatch = orderText.match(/TOTAL:\s*₦([\d,]+)/);

        if (!totalMatch) {
            alert("Could not calculate the order total.");
            return;
        }

        const total = Number(totalMatch[1].replace(/,/g, ""));

        // Paystack amount is in kobo
        const amount = total * 100;

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

const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
        navLinks.classList.toggle("show");
    });
}