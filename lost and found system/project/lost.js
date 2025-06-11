document.addEventListener("DOMContentLoaded", function () {
    const lostItemsList = document.getElementById("lostItemsList");
    const lostItemForm = document.getElementById("lostItemForm");

    if (lostItemsList) {
        console.log("Lost Items List found. Fetching items...");
        fetchLostItems();
    }

    if (lostItemForm) {
        lostItemForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            // Check Firebase auth state just once here
            firebase.auth().onAuthStateChanged(async function (user) {
                if (!user) {
                    alert("You must be logged in to submit a lost item.");
                    return;
                }

                console.log("User ID:", user.uid);  // Debugging: Log the user ID
                // Proceed with the form submission if the user is logged in
                const formData = new FormData();
                formData.append("user_id", user.uid);  // Ensure the user ID is appended properly
                formData.append("itemName", document.getElementById("itemName").value);
                formData.append("category", document.getElementById("category").value);
                formData.append("lostDate", formatDate(document.getElementById("lostDate").value));
                formData.append("lostLocation", document.getElementById("lostLocation").value);
                formData.append("itemDescription", document.getElementById("itemDescription").value);
                formData.append("contactName", document.getElementById("contactName").value);
                formData.append("contactEmail", document.getElementById("contactEmail").value);
                formData.append("contactPhone", document.getElementById("contactPhone").value);
                formData.append("latitude", document.getElementById("latitude").value);
                formData.append("longitude", document.getElementById("longitude").value);

                const imageFile = document.getElementById("itemImage").files[0];
                if (imageFile) {
                    formData.append("itemImage", imageFile);
                }

                try {
                    const response = await fetch("http://127.0.0.1:5000/report-lost-item", {
                        method: "POST",
                        body: formData,
                        headers: { "Accept": "application/json; charset=utf-8" }
                    });

                    const result = await response.json();

                    if (response.ok) {
                        alert(result.message);
                        fetchLostItems(); // Refresh list after submission
                    } else {
                        alert("Error: " + (result.error || "Unknown error occurred."));
                    }
                } catch (error) {
                    console.error("Error:", error);
                    alert("Failed to submit report. Please check your connection.");
                }

                lostItemForm.reset();
            });
        });
    }

    loadLeaflet(() => initMap());
});

// Load Leaflet dynamically
function loadLeaflet(callback) {
    if (typeof L !== "undefined") {
        console.log("✅ Leaflet.js is already loaded!");
        callback();
        return;
    }

    console.log("📥 Loading Leaflet.js...");

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet/dist/leaflet.js";
    script.onload = () => {
        console.log("✅ Leaflet.js Loaded!");
        callback();
    };
    script.onerror = () => console.error("❌ Failed to load Leaflet.js!");

    document.head.appendChild(script);
}

// Function to fetch lost items
async function fetchLostItems() {
    try {
        const response = await fetch("http://127.0.0.1:5000/get-lost-items", {
            headers: { "Accept": "application/json; charset=utf-8" }
        });
        const items = await response.json();

        const lostItemsList = document.getElementById("lostItemsList");
        if (!lostItemsList) return;

        lostItemsList.innerHTML = ""; // Clear list
        items.forEach(addItemToList);
    } catch (error) {
        console.error("Error fetching lost items:", error);
    }
}

// Function to add lost items to the list
function addItemToList(item) {
    const lostItemsList = document.getElementById("lostItemsList");
    if (!lostItemsList) return;

    const itemDiv = document.createElement("div");
    itemDiv.classList.add("lost-item");

    itemDiv.innerHTML = `
        <h3>${item.item_name}</h3>
        <p><strong>Category:</strong> ${item.category}</p>
        <p><strong>Date Lost:</strong> ${formatDate(item.lost_date)}</p>
        <p><strong>Location:</strong> ${item.lost_location}</p>
        <p><strong>Description:</strong> ${item.item_description}</p>
        <p><strong>Contact:</strong> ${item.contact_name}, ${item.contact_email}, ${item.contact_phone}</p>
        ${item.image_path ? `<img src="${item.image_path}" alt="Lost Item Image" width="150">` : ""}
        <br>
    `;

    // Create View on Map button and append to item div
    const viewMapButton = document.createElement("button");
    viewMapButton.classList.add("view-map-btn");
    viewMapButton.textContent = "📍View on Map";
    viewMapButton.dataset.lat = item.latitude;
    viewMapButton.dataset.lng = item.longitude;

    viewMapButton.addEventListener("click", function () {
        const lat = parseFloat(viewMapButton.dataset.lat);
        const lng = parseFloat(viewMapButton.dataset.lng);
        if (lat && lng) {
            map.setView([lat, lng], 15);
            const marker = L.marker([lat, lng]).addTo(map); // Create marker only after clicking
        } else {
            alert("Invalid coordinates.");
        }
    });

    itemDiv.appendChild(viewMapButton);
    lostItemsList.appendChild(itemDiv);
}

// Format date function
function formatDate(dateString) {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
}

// Leaflet map initialization
function initMap() {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    map = L.map("map").setView([30.3165, 78.0322], 13); // Dehradun default
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    // Initially no marker on the map
    let marker;

    const latInput = document.getElementById("latitude");
    const lngInput = document.getElementById("longitude");
    const locationInput = document.getElementById("lostLocation");

    function updateLocationFields(lat, lng, locationName = "") {
        if (locationInput) locationInput.value = locationName || `Lat: ${lat}, Lng: ${lng}`;
        if (latInput) latInput.value = lat;
        if (lngInput) lngInput.value = lng;
    }

    async function getLocationName(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await response.json();
            return data?.display_name || `Lat: ${lat}, Lng: ${lng}`;
        } catch (error) {
            console.error("Error fetching location name:", error);
            return `Lat: ${lat}, Lng: ${lng}`;
        }
    }

    map.on("click", async function (e) {
        const { lat, lng } = e.latlng;
        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        }
        const locationName = await getLocationName(lat, lng);
        updateLocationFields(lat, lng, locationName);
    });

    marker?.on("dragend", async function () {
        const position = marker.getLatLng();
        const locationName = await getLocationName(position.lat, position.lng);
        updateLocationFields(position.lat, position.lng, locationName);
    });

    if (locationInput) {
        locationInput.addEventListener("change", function () {
            const location = this.value.trim();
            if (!location) return;

            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.length > 0) {
                        const lat = data[0].lat;
                        const lng = data[0].lon;
                        marker.setLatLng([lat, lng]);
                        map.setView([lat, lng], 15);
                        updateLocationFields(lat, lng, data[0].display_name);
                    } else {
                        alert("Location not found. Try a more specific address.");
                    }
                })
                .catch(err => console.error("Location fetch error:", err));
        });
    }
}
