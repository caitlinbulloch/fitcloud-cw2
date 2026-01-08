// === FitCloud View Page ===
const GET_API_URL = "https://prod-63.uksouth.logic.azure.com:443/workflows/f76358b2114c409c9e2d117f2be3c587/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=sLYILTIDHgZqd5wLlV7aARLQCyWhE9qBzM0p5S-gI5Y";
const UPDATE_API_URL = "https://prod-39.uksouth.logic.azure.com/workflows/bfa4c9f449fa439596756088518a140a/triggers/When_an_HTTP_request_is_received/paths/invoke/workouts/%7Bid%7D?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=jFgOG8CpnNYf4lHOe1DJul47oYgS8IkAQNJAhqPObBw";

let workouts = [];
let currentPage = 1;
const itemsPerPage = 6;

$(document).ready(() => {
  fetchWorkouts();

  $("#searchInput").on("input", function () {
    const term = $(this).val().toLowerCase();
    const filtered = workouts.filter(w =>
      w.workoutType?.toLowerCase().includes(term) ||
      w.description?.toLowerCase().includes(term)
    );
    renderWorkouts(filtered);
  });

  $("#prevPage").on("click", () => {
    if (currentPage > 1) { currentPage--; paginate(); }
  });
  $("#nextPage").on("click", () => {
    const totalPages = Math.ceil(workouts.length / itemsPerPage);
    if (currentPage < totalPages) { currentPage++; paginate(); }
  });

  $("#cancelUpdate").on("click", () => $("#updateModal").addClass("hidden"));
  $("#updateForm").on("submit", handleUpdate);
});

function fetchWorkouts() {
  $("#workoutGrid").html("<p class='text-center text-gray-500'>Fetching workouts...</p>");
  $.ajax({
    url: GET_API_URL,
    type: "GET",
    dataType: "json",
    success: data => {
      workouts = data.filter(w => !w.isDeleted);
      paginate();
    },
    error: err => {
      console.error("Error fetching workouts:", err);
      $("#workoutGrid").html("<p class='text-center text-red-600'>Error loading workouts.</p>");
    }
  });
}

function paginate() {
  const totalPages = Math.ceil(workouts.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  renderWorkouts(workouts.slice(start, end));
  $("#pageInfo").text(`Page ${currentPage} of ${totalPages}`);
}

function renderWorkouts(list) {
  if (!list.length) {
    $("#workoutGrid").html("<p class='text-center text-gray-500'>No workouts found.</p>");
    return;
  }

  const cards = list.map(w => `
    <div class="workout-card">
      <div class="workout-type">${w.workoutType || "Unknown"}</div>
      <div class="workout-desc">${w.description || ""}</div>
      <div class="workout-meta">Duration: ${w.duration || "N/A"} min</div>
      ${w.mediaUrl?.endsWith(".mp4")
        ? `<video src="${w.mediaUrl}" controls class="workout-media"></video>`
        : w.mediaUrl
        ? `<audio src="${w.mediaUrl}" controls class="workout-media"></audio>`
        : `<div class='text-gray-400 italic mb-2'>No media available</div>`}
      <div class="card-actions">
        <button class="btn-small" onclick='openUpdateModal(${JSON.stringify(w)})'>Update</button>
        <button class="btn-small bg-[#14b8a6]" onclick='deleteWorkout("${w.id}")'>Delete</button>
      </div>
    </div>
  `).join("");

  $("#workoutGrid").html(cards);
}

function openUpdateModal(workout) {
  $("#updateId").val(workout.id);
  $("#updateType").val(workout.workoutType);
  $("#updateDuration").val(workout.duration);
  $("#updateDescription").val(workout.description);
  $("#updateModal").removeClass("hidden").addClass("flex");
}

async function handleUpdate(e) {
  e.preventDefault();
  const id = $("#updateId").val();
  const original = workouts.find(w => w.id === id);
    const updatedData = {
    id,
    workoutType: $("#updateType").val(),
    duration: parseInt($("#updateDuration").val(), 10),
    description: $("#updateDescription").val(),
    mediaUrl: original?.mediaUrl || "",
    translatedWorkoutType: original?.translatedWorkoutType || "",
    isDeleted: false
  };
  try {
    const res = await fetch(UPDATE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });
    if (res.ok) {
      alert("Workout updated!");
      $("#updateModal").addClass("hidden");
      fetchWorkouts();
    } else alert("Failed to update workout");
  } catch (err) { console.error(err); }
}

async function deleteWorkout(id) {
  if (!confirm("Delete this workout?")) return;
  const payload = { id, isDeleted: true };
  try {
    const res = await fetch(UPDATE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert("Workout deleted");
      fetchWorkouts();
    } else alert("Delete failed");
  } catch (err) { console.error(err); }
}
