document.getElementById("searchBtn").addEventListener("click", () => {
  const keyword = document.getElementById("searchInput").value.trim();
  if (!keyword) {
    alert("Please enter a search term.");
    return;
  }

  fetch(`http://127.0.0.1:5000/search_matches?q=${encodeURIComponent(keyword)}`)
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("matchedItemsContainer");
      const countDiv = document.getElementById("matchedCount");
      container.innerHTML = "";
      countDiv.textContent = "";

      if (!data.length) {
        container.innerHTML = "<p>No matched items found for that keyword.</p>";
        countDiv.textContent = "Total Matched Items: 0";
        return;
      }

      countDiv.textContent = `Total Matched Items: ${data.length}`;

      data.forEach((item) => {
        const card = document.createElement("div");
        card.className = "item-card";

        card.innerHTML = `
          <div class="items-container">
            <div class="lost-item">
              <h3>Lost Item</h3>
              <p><strong>Name:</strong> ${item.lost_name}</p>
              <p><strong>Description:</strong> ${item.lost_description}</p>
              <p><strong>Location:</strong> ${item.lost_location}</p>
              <p><strong>Contact:</strong> ${item.contact_name} (${item.contact_phone})</p>
              <img src="${item.lost_image}" alt="Lost Item" width="200">
            </div>

            <div class="found-item">
              <h3>Found Item</h3>
              <p><strong>Name:</strong> ${item.found_name}</p>
              <p><strong>Description:</strong> ${item.found_description}</p>
              <p><strong>Location:</strong> ${item.location_name}</p>
              <p><strong>Finder:</strong> ${item.finder_name} (${item.phone})</p>
              <img src="${item.found_image}" alt="Found Item" width="200">
            </div>
          </div>
        `;

        container.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Search error:", err);
    });
});
