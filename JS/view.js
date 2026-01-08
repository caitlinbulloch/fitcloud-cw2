// === FitCloud View Page ===

// Logic App endpoints
const GET_API_URL = "https://prod-63.uksouth.logic.azure.com:443/workflows/f76358b2114c409c9e2d117f2be3c587/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=sLYILTIDHgZqd5wLlV7aARLQCyWhE9qBzM0p5S-gI5Y";
const UPDATE_API_URL = "https://prod-39.uksouth.logic.azure.com/workflows/bfa4c9f449fa439596756088518a140a/triggers/When_an_HTTP_request_is_received/paths/invoke/workouts/%7Bid%7D?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=jFgOG8CpnNYf4lHOe1DJul47oYgS8IkAQNJAhqPObBw";
const SEARCH_URL = "https://fitcloud-search-cw2.search.windows.net/indexes/fitcloud-search-ai/docs/search?api-version=2024-07-01";
const SEARCH_KEY = localStorage.getItem("AZURE_SEARCH_KEY");

$(document).ready(() => {
  fetchWorkouts();

  // Search filter
  $("#searchInput").on("input", async function () {
    const term = $(this).val().trim();
    if (term === "") {
        fetchWorkouts(); // fallback to all
        return;
    }

    try {
        const response = await fetch(SEARCH_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": SEARCH_KEY
        },
        body: JSON.stringify({ search: term })
        });
        const result = await response.json();
        renderWorkouts(result.value);
    } catch (err) {
        console.error("Search error:", err);
    }
  });


  // Cancel modal
  $("#cancelUpdate").on("click", function () {
    $("#updateModal").addClass("hidden").removeClass("flex");
    currentWorkout = null;
  });

  // Handle update submit
  $("#updateForm").on("submit", async function (e) {
    e.preventDefault();
    if (!currentWorkout) return;

    const updatedData = {
      id: $("#updateId").val(),
      userId: currentWorkout.userId,
      workoutType: $("#updateType").val(),
      duration: parseInt($("#updateDuration").val(), 10),
      description: $("#updateDescription").val(),
      mediaUrl: currentWorkout.mediaUrl,
      isDeleted: false
    };

    try {
      const response = await fetch(UPDATE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        alert("Workout updated successfully!");
        $("#updateModal").addClass("hidden").removeClass("flex");
        fetchWorkouts();
      } else {
        alert("Failed to update workout. Check console for details.");
        console.error(await response.text());
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    }
  });
});

// === Fetch workouts from Logic App ===
function fetchWorkouts() {
  $("#workoutGrid").html("<p class='text-center text-gray-500'>Fetching workouts...</p>");

  $.ajax({
    url: GET_API_URL,
    type: "GET",
    dataType: "json",
    success: (data) => {
      console.log(" Workouts fetched:", data);
      renderWorkouts(data);
    },
    error: (err) => {
      console.error("Error fetching workouts:", err);
      $("#workoutGrid").html("<p class='text-center text-red-600'>Error loading workouts.</p>");
    }
  });
}

// === Render workouts as cards ===
let currentWorkout = null;

function renderWorkouts(workouts) {
  workouts = workouts.filter(w => !w.isDeleted);
  if (!workouts || workouts.length === 0) {
    $("#workoutGrid").html("<p class='text-center text-gray-500'>No workouts found.</p>");
    return;
  }

  const cards = workouts.map((w) => `
    <div class="workout-card">
        <div class="workout-type">${w.workoutType || "Unknown Type"}</div>
        ${w.translatedWorkoutType ? `<p class="text-sm text-teal-600 italic">(Spanish: ${w.translatedWorkoutType})</p>` : ""}
        <div class="workout-desc">${w.description || ""}</div>
        <div class="workout-meta">Duration: ${w.duration || "N/A"} min</div>

      ${
        w.mediaUrl && w.mediaUrl.endsWith(".mp4")
          ? `<video src="${w.mediaUrl}" controls class="workout-media"></video>`
          : w.mediaUrl
          ? `<audio src="${w.mediaUrl}" controls class="workout-media"></audio>`
          : `<div class="text-gray-400 italic mb-2">No media available</div>`
      }

      <div class="card-actions">
        <button class="btn-small" onclick='openUpdateModal(${JSON.stringify(w)})'>Update</button>
        <button class="btn-small bg-[#14b8a6]" onclick='deleteWorkout("${w.id}")'>Delete</button>
      </div>
    </div>
  `);

  $("#workoutGrid").html(cards.join(""));
}

// === Open Update Modal ===
function openUpdateModal(workout) {
  currentWorkout = workout;

  $("#updateId").val(workout.id);
  $("#updateType").val(workout.workoutType);
  $("#updateDuration").val(workout.duration);
  $("#updateDescription").val(workout.description);

  $("#updateModal").removeClass("hidden").addClass("flex");
}

// === Soft Delete (marks isDeleted = true) ===
async function deleteWorkout(id) {
  if (!confirm("Are you sure you want to delete this workout?")) return;

  const payload = {
    id: id,
    isDeleted: true
  };

  try {
    const response = await fetch(UPDATE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert("Workout deleted successfully!");
      fetchWorkouts();
    } else {
      alert("Failed to delete workout. Check console for details.");
      console.error(await response.text());
    }
  } catch (err) {
    console.error(err);
    alert("Error connecting to server.");
  }
}
