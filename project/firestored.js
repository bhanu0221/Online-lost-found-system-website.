document.addEventListener("DOMContentLoaded", function () {
    // Firebase configuration
    const firebaseConfig = {
      apiKey: "",// I have removed my API key
      authDomain: "lost-and-found-system-fc07.firebaseapp.com",
      projectId: "lost-and-found-system-fc07",
      storageBucket: "lost-and-found-system-fc07.firebasestorage.app",
      messagingSenderId: "38915289446",
      appId: "1:38915289446:web:7b5248b3cdd722d66218a7"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // Contact Form Submission
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();

            let name = document.getElementById("name").value;
            let email = document.getElementById("email").value;
            let phone = document.getElementById("phone").value;
            let message = document.getElementById("message").value;

            db.collection("contacts").add({
                name: name,
                email: email,
                phone: phone,
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                document.getElementById("statusMessage").innerText = "Message sent successfully!";
                contactForm.reset();
            }).catch((error) => {
                document.getElementById("statusMessage").innerText = "Error sending message: " + error;
            });
        });
    }

    // Feedback Form Submission
    const feedbackForm = document.getElementById("feedbackForm");
    if (feedbackForm) {
        feedbackForm.addEventListener("submit", function (e) {
            e.preventDefault();

            let name = document.getElementById("name").value;
            let email = document.getElementById("email").value;
            let message = document.getElementById("message").value;

            db.collection("feedbacks").add({
                name: name,
                email: email,
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                document.getElementById("responseMessage").innerText = "Feedback submitted successfully!";
                feedbackForm.reset();
            }).catch((error) => {
                document.getElementById("responseMessage").innerText = "Error submitting feedback: " + error;
            });
        });
    }

});
