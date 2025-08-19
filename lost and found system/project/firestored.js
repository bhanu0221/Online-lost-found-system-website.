document.addEventListener("DOMContentLoaded", function () {
    // Firebase configuration
    import firebaseConfig from "./firebaseConfig.js";

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
