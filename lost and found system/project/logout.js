// Your Firebase Configuration (Replace with your own)
import firebaseConfig from "./firebaseConfig.js";

// Initialize Firebase
firebase.initializeApp(firebaseConfig); type="text/javascript">

// Logout Function
document.addEventListener("DOMContentLoaded", function () {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent default link behavior

            firebase.auth().signOut().then(() => {
                alert("Logged out successfully!");
                window.location.href = "interface.html"; // Redirect after logout
            }).catch((error) => {
                console.error("Logout Error:", error);
            });
        });
    }

});
