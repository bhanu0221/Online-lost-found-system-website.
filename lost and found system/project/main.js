  // Firebase Configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAsHXV79dwe-KFmEtU9G8_QMjC9eq_zDzY",
    authDomain: "lost-and-found-system-fc07.firebaseapp.com",
    projectId: "lost-and-found-system-fc07",
    storageBucket: "lost-and-found-system-fc07.firebasestorage.app",
    messagingSenderId: "38915289446",
    appId: "1:38915289446:web:7b5248b3cdd722d66218a7"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // Initialize Firestore
const db = firebase.firestore();

  // Google Authentication Provider
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" }); // Forces account selection

  // Get UI elements
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");
  const userInfo = document.getElementById("user-info");

  // Google Login Function
  if (loginBtn) {
    loginBtn.addEventListener("click", function () {
      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          console.log("User logged in:", result.user.displayName);
          window.location.href = "home.html"; // Redirect to home page
        })
        .catch((error) => {
          console.error("Google Login Error:", error);
        });
    });
  }

  
// Sign up function (with Firestore integration)
const signUp = () => {
  const fullName = document.getElementById("full-name").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const errorMessage = document.getElementById("error-message");
  const accountExistsMessage = document.getElementById("account-exists-message");

  errorMessage.textContent = "";
  accountExistsMessage.style.display = "none";

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!fullName || !username || !email || !password || !confirmPassword) {
    errorMessage.textContent = "Please fill out all fields.";
    return;
  }

  if (!emailPattern.test(email)) {
    errorMessage.textContent = "Please enter a valid email address.";
    return;
  }

  if (password.length < 6) {
    errorMessage.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (password !== confirmPassword) {
    errorMessage.textContent = "Passwords do not match!";
    return;
  }

  // Firebase authentication
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((result) => {
      const user = result.user;

      return db.collection("users").doc(user.uid).set({
        uid: user.uid,
        fullName: fullName,
        username: username,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      alert("Sign Up Successful!");
      window.location.href = "index.html";
    })
    .catch((error) => {
      if (error.code === "auth/email-already-in-use") {
        accountExistsMessage.style.display = "block";
      } else {
        errorMessage.textContent = error.message;
      }
    });
};


  // LogIn function
  const Login = () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");
  
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((result) => {
        alert("Login Successful!");
        window.location.href = "home.html";
        console.log(result);
        errorMessage.textContent = ""; // Clear error messages
      })
      .catch((error) => {
        let message = "Something went wrong. Please try again.";
  
        if (error.code === "auth/invalid-login-credentials") {
          message = "Invalid email or password. Please try again.";
        } else if (error.code === "auth/user-not-found") {
          message = "No account found with this email.";
        } else {
          message = error.message;
        }
  
        errorMessage.textContent = message;
      });
  };
  