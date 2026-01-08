// === FitCloud View Page with Azure AI Search ===

// Logic App endpoints (for normal CRUD)
const GET_API_URL = "https://prod-63.uksouth.logic.azure.com:443/workflows/f76358b2114c409c9e2d117f2be3c587/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=sLYILTIDHgZqd5wLlV7aARLQCyWhE9qBzM0p5S-gI5Y";
const UPDATE_API_URL = "https://prod-39.uksouth.logic.azure.com/workflows/bfa4c9f449fa439596756088518a140a/triggers/When_an_HTTP_request_is_received/paths/invoke/workouts/%7Bid%7D?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=jFgOG8CpnNYf4lHOe1DJul47oYgS8IkAQNJAhqPObBw";

// Azure AI Search details
const SEARCH_SERVICE = "fitcloud-search-cw2";
const SEARCH_INDEX = "fitcloud-search-cw2";
const SEARCH_URL = "https://prod-63.uksouth.logic.azure.com:443/workflows/f76358b2114c409c9e2d117f2be3c587/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=sLYILTIDHgZqd5wLlV7aARLQCyWhE9qBzM0p5S-gI5Y";

// Get search key (stored locally for security)
const SEARCH_KEY = localStorage.getItem("AZURE_SEARCH_KEY");

// Load workouts when page starts
$(document).ready(() => {
  fetchWorkouts();

  $("#searchInput").on("input", async function () {
    const term = $(this).val().trim();

    if (term.length === 0) {
      fetchWorkouts();
      return;
    }

    try {
      const payload = { search: term };
      console.log("Sending search:", payload);

      const response = await fetch(SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": SEARCH_KEY
        },
        body: JSON.stringify(payload)
      });

      const results = await response.json();
      console.log("🔍 Azure Search results:", results);

      renderWorkouts(results.value);
    } catch (err) {
      console.error("Search error:", err);
    }
  });
});

// === Fetch workouts (default list) ===
function fetchWorkouts() {
  $("#workoutGrid").html("<p class='text-center text-gray-500'>Fetching workouts...</p>");
  $.ajax({
    url: GET_API_URL,
    type: "GET",
    dataType: "json",
    success: (data) => renderWorkouts(data.filter(w => !w.isDeleted)),
    error: (err) => {
      console.error("Error fetching workouts:", err);
      $("#workoutGrid").html("<p class='text-center text-red-600'>Error loading workouts.</p>");
    }
  });
}

// === Render workouts as cards ===
function renderWorkouts(workouts) {
  if (!workouts || workouts.length === 0) {
    $("#workoutGrid").html("<p class='text-center text-gray-500'>No workouts found.</p>");
    return;
  }

  const cards = workouts.map(w => `
    <div class="workout-card">
      <div class="workout-type">${w.workoutType || w.keyPhrases?.[0] || "Unknown Type"}</div>
      <div class="workout-desc">${w.description || ""}</div>
      <div class="workout-meta">Duration: ${w.duration || "N/A"} min</div>
      ${
        w.mediaUrl?.endsWith(".mp4")
          ? `<video src="${w.mediaUrl}" controls class="workout-media"></video>`
          : w.mediaUrl
          ? `<audio src="${w.mediaUrl}" controls class="workout-media"></audio>`
          : `<div class="text-gray-400 italic mb-2">No media available</div>`
      }
    </div>
  `).join("");

  $("#workoutGrid").html(cards);
}
