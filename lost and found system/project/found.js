// =================================
// === Configuration Constants ====
// =================================
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000' 
  : window.location.origin; // Use the current origin for production

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAP_VIEW = [30.3165, 78.0322]; // Dehradun coordinates
const DEFAULT_MAP_ZOOM = 13;
const FOCUS_MAP_ZOOM = 16;

// ===============================
// === Initialize Leaflet Map ====
// ===============================
const mapElement = document.getElementById("map");
let map, marker;

if (mapElement) {
  map = L.map('map').setView(DEFAULT_MAP_VIEW, DEFAULT_MAP_ZOOM);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
}

// ======================================
// === GEOLOCATION FUNCTIONS (API) =====
// ======================================
async function geocodeLocation(location) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Geocoding API failed');
    const data = await response.json();
    return data[0];
  } catch (error) {
    console.error('Geocoding error:', error);
    showStatusMessage('Error searching location. Please try again.', 'error');
    return null;
  }
}

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Reverse geocoding failed');
    const data = await response.json();
    return data.display_name || `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// ==========================
// === Map Interactions ====
// ==========================
if (map) {
  // Click to pin location
  map.on('click', async function(e) {
    const { lat, lng } = e.latlng;
    updateMapMarker(lat, lng);
    
    try {
      const locationName = await reverseGeocode(lat, lng);
      document.getElementById('locationName').value = locationName;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  });

  // Search location button
  document.getElementById('searchLocation')?.addEventListener('click', handleLocationSearch);

  // Current location button
  document.getElementById('currentLocation')?.addEventListener('click', handleCurrentLocation);
}

function updateMapMarker(lat, lng) {
  document.getElementById('latitude').value = lat;
  document.getElementById('longitude').value = lng;

  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng]).addTo(map);
  }

  map.setView([lat, lng], FOCUS_MAP_ZOOM);
}

async function handleLocationSearch() {
  const locationInput = document.getElementById('locationName');
  const location = locationInput.value.trim();
  
  if (!location) {
    showStatusMessage('Please enter a location to search', 'error');
    return;
  }

  try {
    showStatusMessage('Searching location...', 'info');
    const result = await geocodeLocation(location);
    
    if (result) {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      updateMapMarker(lat, lon);
      showStatusMessage('Location found!', 'success');
    } else {
      showStatusMessage('Location not found. Try a different name.', 'error');
    }
  } catch (error) {
    showStatusMessage('Error searching location', 'error');
    console.error('Location search error:', error);
  }
}

function handleCurrentLocation() {
  if (!navigator.geolocation) {
    showStatusMessage('Geolocation is not supported by your browser', 'error');
    return;
  }

  showStatusMessage('Getting your current location...', 'info');
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      updateMapMarker(latitude, longitude);
      
      try {
        const locationName = await reverseGeocode(latitude, longitude);
        document.getElementById('locationName').value = locationName;
        showStatusMessage('Current location set!', 'success');
      } catch (error) {
        console.error('Error getting location name:', error);
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
      showStatusMessage('Error getting current location. Please enable location services.', 'error');
    },
    { timeout: 10000 }
  );
}

// ============================
// === Image Preview Logic ====
// ============================
document.getElementById('itemImage')?.addEventListener('change', function() {
  const file = this.files[0];
  const preview = document.getElementById('preview');

  if (!file) {
    preview.src = '';
    preview.style.display = 'none';
    return;
  }

  // Validate image size
  if (file.size > MAX_IMAGE_SIZE) {
    showStatusMessage('Image must be less than 5MB', 'error');
    this.value = '';
    preview.src = '';
    preview.style.display = 'none';
    return;
  }

  // Validate image type
  if (!file.type.match('image.*')) {
    showStatusMessage('Please select an image file', 'error');
    this.value = '';
    preview.src = '';
    preview.style.display = 'none';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    preview.src = e.target.result;
    preview.style.display = 'block';
    preview.style.maxWidth = '200px';
    preview.style.marginTop = '10px';
  };
  reader.readAsDataURL(file);
});

// ==========================
// === Form Validation ====
// ==========================
function validatePhoneNumber(phone) {
  return /^(\+?\d{1,3}[- ]?)?\d{10}$/.test(phone);
}

function validateForm(formData) {
  // Check location is selected
  if (!formData.get('latitude') || !formData.get('longitude')) {
    showStatusMessage('Please select a location on the map', 'error');
    return false;
  }

  // Validate phone numbers
  if (!validatePhoneNumber(formData.get('phoneNumber'))) {
    showStatusMessage('Please enter a valid phone number (10 digits)', 'error');
    return false;
  }

  if (formData.get('altPhoneNumber') && !validatePhoneNumber(formData.get('altPhoneNumber'))) {
    showStatusMessage('Please enter a valid alternate phone number', 'error');
    return false;
  }

  return true;
}

// ==========================
// === Form Submission ====
// ==========================
document.getElementById('foundItemForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  const submitSpinner = document.getElementById('submitSpinner');
  
  // Show loading state
  if (submitText && submitSpinner) {
    submitText.style.display = 'none';
    submitSpinner.style.display = 'inline-block';
  }
  if (submitBtn) submitBtn.disabled = true;

  const userId = firebase.auth().currentUser?.uid;
  if (!userId) {
    showStatusMessage('User not authenticated. Please log in again.', 'error');
    window.location.href = 'login.html';
    return;
  }

  const formData = new FormData(form);
  formData.append('user_id', userId);

  // Validate form
  if (!validateForm(formData)) {
    if (submitText && submitSpinner) {
      submitText.style.display = 'inline-block';
      submitSpinner.style.display = 'none';
    }
    if (submitBtn) submitBtn.disabled = false;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/submit-found-item`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    showStatusMessage('Item reported successfully!', 'success');
    resetForm();
    
    // Refresh the found items list if on that page
    loadFoundItemsList();
    
  } catch (error) {
    console.error('Submission error:', error);
    showStatusMessage(`Error: ${error.message}`, 'error');
  } finally {
    if (submitText && submitSpinner) {
      submitText.style.display = 'inline-block';
      submitSpinner.style.display = 'none';
    }
    if (submitBtn) submitBtn.disabled = false;
  }
});

function resetForm() {
  const form = document.getElementById('foundItemForm');
  if (form) form.reset();
  
  // Reset map
  if (marker) {
    map.removeLayer(marker);
    marker = null;
  }
  if (map) map.setView(DEFAULT_MAP_VIEW, DEFAULT_MAP_ZOOM);
  
  // Reset image preview
  const preview = document.getElementById('preview');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
}

// ==========================
// === Status Messages ====
// ==========================
function showStatusMessage(message, type = 'success') {
  const status = document.getElementById('statusMessage');
  if (!status) return;

  status.textContent = message;
  status.className = `status-message ${type}`;
  status.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    status.style.display = 'none';
  }, 5000);
}

// ==========================
// === Format Date Function ===
// ==========================
function formatDate(rawDate) {
  const date = new Date(rawDate);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// =================================
// === Focus Map to Found Marker ===
// =================================
function focusMap(lat, lng) {
  lat = parseFloat(lat);
  lng = parseFloat(lng);

  if (!map || isNaN(lat) || isNaN(lng)) return;

  map.setView([lat, lng], FOCUS_MAP_ZOOM);

  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng]).addTo(map);
  }

  const mapEl = document.getElementById('map');
  if (mapEl) {
    mapEl.scrollIntoView({ behavior: 'smooth' });
  }
}

// ==========================
// === Load Found Items ====
// ==========================
function loadFoundItemsList() {
  const list = document.getElementById("foundItemsList");
  if (!list) return;

  // Show loading state
  list.innerHTML = "<li>Loading found items...</li>";

  fetch(`${API_BASE_URL}/api/found-items`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      list.innerHTML = "";

      if (data.length === 0) {
        list.innerHTML = "<li>No found items listed.</li>";
        return;
      }

      data.forEach(item => {
        const li = document.createElement("li");

        li.innerHTML = `
          <div class="found-item" style="padding:10px; border-bottom:1px solid #ccc;">
            ${item.image_path ? `<img src="${item.image_path}" alt="Found Item Image" style="max-width:100px; border-radius:6px;"><br>` : ""}
            <h3>${item.item_name}</h3>
            <p><strong>Category:</strong> ${item.category}</p>
            <p><strong>Date Found:</strong> ${formatDate(item.date_found)}</p>
            <p><strong>Location:</strong> ${item.location_name}</p>
            <p><strong>Coordinates:</strong> ${item.latitude}, ${item.longitude}</p>
            <p><strong>Description:</strong> ${item.description}</p>
            <p>
              <strong>Finder:</strong> ${item.finder_name}<br>
              <strong>Email:</strong> ${item.email}<br>
              <strong>Phone:</strong> ${item.phone}${item.alt_phone ? `, ${item.alt_phone}` : ""}<br>
              <strong>Address:</strong> ${item.address}
            </p>
            <button onclick="focusMap(${item.latitude}, ${item.longitude})" style="margin-top:5px;">
              📍 View on Map
            </button>
          </div>
        `;

        list.appendChild(li);
      });
    })
    .catch(err => {
      console.error("Error loading items:", err);
      list.innerHTML = `
        <li style="color: red;">
          Error loading items. ${err.message}
          ${API_BASE_URL ? `<br><small>Trying to fetch from: ${API_BASE_URL}/api/found-items</small>` : ''}
        </li>
      `;
    });
}

// ==========================
// === Auto Load on Page ====
// ==========================
document.addEventListener("DOMContentLoaded", function() {
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  const dateFoundInput = document.getElementById('dateFound');
  if (dateFoundInput) dateFoundInput.value = today;
  
  // Load any existing items if on a listing page
  loadFoundItemsList();
});