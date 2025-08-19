document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");

    // If on home page with search bar
    if (searchInput && searchBtn) {
        searchBtn.addEventListener("click", function () {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `home-search.html?q=${encodeURIComponent(query)}`;
            }
        });
    }

    // If on results page
    const searchQueryDisplay = document.getElementById("searchQuery");
    const resultsContainer = document.getElementById("results");

    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");

    if (query && resultsContainer && searchQueryDisplay) {
        searchQueryDisplay.textContent = `Showing results for: "${query}"`;

        fetch(`http://127.0.0.1:5000/search?q=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) throw new Error("Network response was not OK");
                return response.json();
            })
            .then(data => {
                if (!data.length) {
                    resultsContainer.innerHTML = "<p>No items found.</p>";
                } else {
                    resultsContainer.innerHTML = data.map(item => {
                        const isFound = item.type && item.type.toLowerCase() === "found";

                        return `
                            <div class="item-card">
                                <div class="item-type">
                                    <strong>Type:</strong> ${item.type ? item.type.toUpperCase() : 'UNKNOWN'}
                                </div>
                                <img src="${item.image_url || 'images/placeholder.png'}" alt="Item Image" class="item-image">

                                <div class="item-details">
                                    <h3>${item.title}</h3>
                                    <p><strong>Description:</strong> ${item.description}</p>
                                    ${item.date_found ? `<p><strong>Date Found:</strong> ${new Date(item.date_found).toLocaleDateString()}</p>` : ''}
                                    ${item.lost_date ? `<p><strong>Date Lost:</strong> ${new Date(item.lost_date).toLocaleDateString()}</p>` : ''}
                                    ${item.location_name ? `<p><strong>Location Found:</strong> ${item.location_name}</p>` : ''}
                                    ${item.lost_location ? `<p><strong>Location Lost:</strong> ${item.lost_location}</p>` : ''}

                                    ${
                                        isFound
                                            ? `
                                                ${item.finder_name ? `<p><strong>Finder Name:</strong> ${item.finder_name}</p>` : ''}
                                                ${item.finder_phone ? `<p><strong>Finder Phone:</strong> ${item.finder_phone}</p>` : ''}
                                                ${item.finder_email ? `<p><strong>Finder Email:</strong> ${item.finder_email}</p>` : ''}
                                            `
                                            : `
                                                ${item.contact_name ? `<p><strong>Contact Name:</strong> ${item.contact_name}</p>` : ''}
                                                ${item.contact_phone ? `<p><strong>Contact Phone:</strong> ${item.contact_phone}</p>` : ''}
                                                ${item.contact_email ? `<p><strong>Contact Email:</strong> ${item.contact_email}</p>` : ''}
                                            `
                                    }
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            })
            .catch(error => {
                console.error("Search error:", error);
                resultsContainer.innerHTML = "<p>There was an error fetching results.</p>";
            });
    }
});
