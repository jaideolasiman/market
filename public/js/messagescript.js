document.addEventListener("DOMContentLoaded", function() {
    // Get the flash messages div
    const flashMessages = document.getElementById("flash-messages");
    if (!flashMessages) return;

    // Read success and error messages
    const successMessage = flashMessages.getAttribute("data-success");
    const errorMessage = flashMessages.getAttribute("data-error");

    // Show SweetAlert popups based on messages
    if (successMessage) {
        Swal.fire({
            title: "Success",
            text: successMessage,
            icon: "success",
            confirmButtonColor: "#4CAF50",
            confirmButtonText: "OK",
            timer: 3000 // Auto-close after 3 seconds
        });
    }

    if (errorMessage) {
        Swal.fire({
            title: "Error",
            text: errorMessage,
            icon: "error",
            confirmButtonColor: "#FF5733",
            confirmButtonText: "OK"
        });
    }
});
