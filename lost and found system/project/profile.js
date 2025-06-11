// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAsHXV79dwe-KFmEtU9G8_QMjC9eq_zDzY",
  authDomain: "lost-and-found-system-fc07.firebaseapp.com",
  projectId: "lost-and-found-system-fc07",
  storageBucket: "lost-and-found-system-fc07",
  messagingSenderId: "38915289446",
  appId: "1:38915289446:web:7b5248b3cdd722d66218a7"
};
firebase.initializeApp(firebaseConfig);

let currentUserId = null;
let currentUser = null;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;
    currentUser = user;
    document.getElementById("user-email").textContent = user.email;
    document.getElementById("user-name").textContent = user.displayName || "No name set";
    loadUserItems(user.uid);
  } else {
    alert("Please log in first.");
    window.location.href = "login.html";
  }
});

// Show edit profile modal
document.getElementById("edit-profile-btn").addEventListener("click", () => {
  document.getElementById("edit-profile-modal").style.display = "block";
  document.getElementById("name-input").value = currentUser.displayName || "";
});

// Cancel editing
document.getElementById("cancel-btn").addEventListener("click", () => {
  document.getElementById("edit-profile-modal").style.display = "none";
});

// Save changes (name update)
document.getElementById("save-changes-btn").addEventListener("click", () => {
  const newName = document.getElementById("name-input").value;

  // Update the user's name in Firebase Auth
  currentUser.updateProfile({
    displayName: newName || currentUser.displayName
  }).then(() => {
    alert("Profile updated successfully!");
    document.getElementById("user-name").textContent = newName || currentUser.displayName;
    document.getElementById("edit-profile-modal").style.display = "none";
  }).catch(error => {
    console.error("Error updating profile:", error);
    alert("Failed to update profile.");
  });
});

function loadUserItems(userId) {
  fetch(`http://127.0.0.1:5000/user-profile?user_id=${userId}`)
    .then(response => response.json())
    .then(data => {
      displayItems(data.lost_items, "lost-items", "lost");
      displayItems(data.found_items, "found-items", "found");
    })
    .catch(err => {
      console.error("Error fetching user data:", err);
    });
}

function displayItems(items, containerId, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = "<p>No items reported.</p>";
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <strong>${item.item_name}</strong><br/>
      Category: ${item.category || "N/A"}<br/>
      ${item.lost_date ? `Lost Date: ${formatDate(item.lost_date)}` : ""}
      ${item.date_found ? `Found Date: ${formatDate(item.date_found)}` : ""}<br/>
      Location: ${item.lost_location || item.location_name || "N/A"}<br/>
      Description: ${item.item_description || item.description || ""}<br/>
      
      <!-- Contact Information -->
      ${type === 'lost' ? `
        Contact Name: ${item.contact_name || "N/A"}<br/>
        Contact Email: ${item.contact_email || "N/A"}<br/>
        Contact Phone: ${item.contact_phone || "N/A"}<br/>
      ` : `
        Finder Name: ${item.finder_name || "N/A"}<br/>
        Finder Phone: ${item.phone || "N/A"}<br/>
        Alt Phone: ${item.alt_phone || "N/A"}<br/>
      `}
      
      ${item.image_path ? `<img src="http://127.0.0.1:5000/${item.image_path}" alt="Item Image">` : ""}
      <br/>
      <button onclick="deleteItem('${item.id}', '${type}', this)">Delete</button>
    `;
    container.appendChild(card);
  });
}

function deleteItem(itemId, type, buttonElement) {
  if (!confirm("Are you sure you want to delete this item?")) return;

  fetch(`http://127.0.0.1:5000/delete-item/${type}/${itemId}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Item deleted successfully.");
        const card = buttonElement.closest(".item-card");
        card.remove();
      } else {
        alert("Failed to delete item.");
      }
    })
    .catch(err => {
      console.error("Error deleting item:", err);
      alert("Error occurred.");
    });
}
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);

  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

