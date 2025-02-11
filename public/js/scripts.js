// Function to open the product modal
function openModal() {
    document.getElementById("productModal").style.display = "block";
}

// Function to close the modal
function closeModal() {
    document.getElementById("productModal").style.display = "none";
}


// Handle the form submission via AJAX
// Handle the form submission via AJAX
$(document).ready(function () {
    $("#productFormSubmit").on("submit", function (e) {
        e.preventDefault(); // Prevent default form submission

        var formData = new FormData(this); // Get form data (including file)
        
        // Convert auction date fields to Philippine Time (PHT)
        if (formData.get("auctionStart")) {
            let auctionStart = new Date(formData.get("auctionStart"));
            formData.set("auctionStart", auctionStart.toLocaleString("en-PH", { timeZone: "Asia/Manila" }));
        }
        
        if (formData.get("auctionEnd")) {
            let auctionEnd = new Date(formData.get("auctionEnd"));
            formData.set("auctionEnd", auctionEnd.toLocaleString("en-PH", { timeZone: "Asia/Manila" }));
        }
        
        $.ajax({
            url: "/farmer/addProduct", // Backend route
            type: "POST",
            data: formData,
            contentType: false, // Prevent jQuery from setting contentType
            processData: false, // Prevent jQuery from processing the data
            success: function (response) {
                alert("Product added successfully!");
                closeModal(); // Close the modal on success
                location.reload(); // Reload to reflect changes
            },
            error: function (err) {
                alert("Failed to add product. Please try again.");
                console.error("Error adding product:", err);
            }
        });
    });
});


// Function to show/hide auction fields based on product type selection
function toggleAuctionFields(show) {
    document.getElementById("auctionFields").style.display = show ? "block" : "none";
}

// Convert auction date and time to Philippine format (for displaying)
document.addEventListener("DOMContentLoaded", function () {
    let auctionStart = "<%= product && product.auctionStart ? moment(product.auctionStart).tz('Asia/Manila').format('MMMM D, YYYY h:mm A') : '' %>";
    let auctionEnd = "<%= product && product.auctionEnd ? moment(product.auctionEnd).tz('Asia/Manila').format('MMMM D, YYYY h:mm A') : '' %>";

    if (auctionStart) document.getElementById("auctionStart").value = auctionStart;
    if (auctionEnd) document.getElementById("auctionEnd").value = auctionEnd;
});

// Toggle profile dropdown visibility
function toggleProfileDropdown() {
    const dropdown = document.getElementById("profileDropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

// Close profile dropdown when clicking outside
document.addEventListener("click", function (event) {
    if (!event.target.closest(".profile-btn") && !event.target.closest("#profileDropdown")) {
        document.getElementById("profileDropdown").style.display = "none";
    }
});

// Toggle settings dropdown visibility
function toggleSettingsDropdown() {
    const settingsDropdown = document.getElementById("settingsDropdown");
    settingsDropdown.style.display = settingsDropdown.style.display === "block" ? "none" : "block";
}

// Close settings dropdown when clicking outside
document.addEventListener("click", function (event) {
    if (!event.target.closest(".settings-button") && !event.target.closest("#settingsDropdown")) {
        document.getElementById("settingsDropdown").style.display = "none";
    }
});


function toggleCategories() {
    const categoryList = document.getElementById("categoryList");
    categoryList.style.display = categoryList.style.display === "block" ? "none" : "block";
}

// Function to filter products based on category


// Function to check if user is logged in before accessing product details or adding to cart
let isLoggedIn = false; // Change this to true for a logged-in user simulation





// Notification toggle
document.addEventListener('DOMContentLoaded', function() {
        // Get the modal and notification button
        const modal = document.getElementById("notificationModal");
        const notificationButton = document.getElementById("notificationButton");
        const closeModalButton = document.getElementById("closeModalButton");

        // Open the modal when the notification button is clicked
        notificationButton.onclick = function() {
            modal.style.display = "block";
        }

        // Close the modal when the close button is clicked
        closeModalButton.onclick = function() {
            modal.style.display = "none";
        }

        // Close the modal if the user clicks outside of the modal
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }

        // Attach event listeners for each "close" button in the notification list
        const closeButtons = document.querySelectorAll('.close-notification');
        closeButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                const notificationId = event.target.getAttribute('data-notification-id');
                closeNotification(notificationId);
            });
        });
    });

    // Function to close individual notification
    // Close notification and hide it temporarily using localStorage
function closeNotification(notificationId) {
    // Save the closed notification ID to localStorage
    let closedNotifications = JSON.parse(localStorage.getItem('closedNotifications')) || [];
    closedNotifications.push(notificationId);
    localStorage.setItem('closedNotifications', JSON.stringify(closedNotifications));

    // Hide the notification element on the page
    const notificationElement = document.getElementById(`notification-${notificationId}`);
    notificationElement.style.display = 'none';
}
// Check localStorage for closed notifications and hide them on page load
window.onload = function() {
    const closedNotifications = JSON.parse(localStorage.getItem('closedNotifications')) || [];

    // Hide all closed notifications
    closedNotifications.forEach(notificationId => {
        const notificationElement = document.getElementById(`notification-${notificationId}`);
        if (notificationElement) {
            notificationElement.style.display = 'none';
        }
    });
};

// Function to update the clock every second
function updateClock() {
    const currentTime = document.getElementById("currentTime");
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    currentTime.textContent = `${hours}:${minutes}:${seconds}`;
}

// Start clock updates
updateClock();
setInterval(updateClock, 1000);

function showAllProducts() {
    document.getElementById('all-products-section').style.display = 'block';
    document.getElementById('category-products-section').style.display = 'none';
}

function filterProducts(categoryId) {
    document.getElementById('all-products-section').style.display = 'none';
    document.getElementById('category-products-section').style.display = 'block';

    let sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
        section.style.display = section.getAttribute('data-category-id') === categoryId ? 'block' : 'none';
    });
}

function searchProducts() {
        let input = document.getElementById('searchInput').value.toLowerCase();
        let products = document.querySelectorAll('.product');
            products.forEach(product => {
                let productName = product.getAttribute('data-name');
                    if (productName.includes(input)) {
                        product.style.display = "block";
                    } else {
                        product.style.display = "none";
                    }
    });
    }
function openProductDetails(id, name, price, image) {
    document.getElementById('modalProductName').innerText = name;
    document.getElementById('modalProductPrice').innerText = "Price: ₱" + parseFloat(price).toFixed(2);
    document.getElementById('modalProductImage').src = image ? '/public/img/product/' + image.split('/').pop() : '/public/img/default.png';
        
    document.getElementById('productDetailsModal').style.display = "flex";
    }

    function closeProductDetails() {
        document.getElementById('productDetailsModal').style.display = "none";
    }
    function showProductDetails(event, name, price, image) {
        document.getElementById("popupName").innerText = name;
        document.getElementById("popupPrice").innerText = "Price: ₱" + parseFloat(price).toFixed(2);
        document.getElementById("popupImage").src = image;

        let popup = document.getElementById("productDetailsPopup");
        popup.style.display = "block";
    }

    function hideProductDetails() {
        document.getElementById("productDetailsPopup").style.display = "none";
    }
    function fetchNotifications() {
        fetch('/farmer/notifications')
            .then(response => response.json())
            .then(data => {
                document.getElementById("notificationCount").innerText = data.count;
            });
    }

    setInterval(fetchNotifications, 5000); // Refresh every 5 seconds