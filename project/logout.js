// Your Firebase Configuration (Replace with your own)
const firebaseConfig = {
  apiKey: "AIzaSyAsHXV79dwe-KFmEtU9G8_QMjC9eq_zDzY",
  authDomain: "lost-and-found-system-fc07.firebaseapp.com",
  projectId: "lost-and-found-system-fc07",
  storageBucket: "lost-and-found-system-fc07.firebasestorage.app",
  messagingSenderId: "38915289446",
  appId: "1:38915289446:web:7b5248b3cdd722d66218a7"
};

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