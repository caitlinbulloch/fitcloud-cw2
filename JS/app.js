// === Azure Logic App endpoints & storage account ===
const IUPS =
  "https://prod-24.uksouth.logic.azure.com:443/workflows/f4c12b150cfc478bb1e706e74a0dc6cc/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=HjRrfLSByHoV2MJw_LzLe438x6qXec-Y1Lf5Zqt1nBg";
const RAI =
  "https://prod-63.uksouth.logic.azure.com:443/workflows/f76358b2114c409c9e2d117f2be3c587/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=sLYILTIDHgZqd5wLlV7aARLQCyWhE9qBzM0p5S-gI5Y";
const BLOB_ACCOUNT = "https://fitcloudcw2storage.blob.core.windows.net/workout-images";
const UPDATE_URI =
  "https://prod-39.uksouth.logic.azure.com/workflows/bfa4c9f449fa439596756088518a140a/triggers/When_an_HTTP_request_is_received/paths/invoke/workouts/%7Bid%7D?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=jFgOG8CpnNYf4lHOe1DJul47oYgS8IkAQNJAhqPObBw";

// === jQuery handlers ===
$(document).ready(function () {
  $("#retImages").click(getImages);
  $("#subNewForm").click(submitNewAsset);
  $("#logoutBtn").click(() => (window.location.href = "login.html"));
});

// === Create new workout (FitCloud) ===
function submitNewAsset() {
  const id = $("#FileName").val().trim();       
  const userId = $("#userID").val().trim();     
  const workoutType = $("#userName").val().trim(); 
  const duration = 30;                          
  const imageUrl = `${BLOB_ACCOUNT}/${id}.jpg`;

  const body = JSON.stringify({
    id,
    userId,
    workoutType,
    duration,
    imageUrl,
    isDeleted: false,
  });

  $.ajax({
    url: IUPS,
    type: "POST",
    data: body,
    contentType: "application/json",
    success: (data) => {
      console.log("Workout created:", data);
      alert("Workout created successfully!");
    },
    error: (xhr, status, err) => {
      console.error("Create failed:", status, err, xhr?.responseText);
      alert("Create failed — check console for details.");
    },
  });
}

/// === Retrieve and render workouts ===
function getImages() {
  const $list = $("#ImageList");
  $list
    .addClass("media-grid")
    .html('<div class="spinner-border" role="status"><span>Loading...</span></div>');

  $.ajax({
    url: RAI,
    type: "GET",
    dataType: "json",
    success: function (data) {
      console.log("Workouts received:", data);
      if (!Array.isArray(data) || data.length === 0) {
        $list.html("<p>No workouts found.</p>");
        return;
      }

      const cards = data.map((w) => {
        const img = w.imageUrl || "";
        const id = w.id || "";
        const type = w.workoutType || "";
        const uid = w.userId || "";
        const dur = w.duration || "";
        return `
          <div class="media-card">
            <div class="media-thumb">
              <img src="${img}" alt="${id}"
                  onerror="this.onerror=null;this.src='https://via.placeholder.com/200x150?text=No+Image';" />
            </div>
            <div class="media-body">
              <span class="media-title">${type}</span>
              <div><strong>ID:</strong> ${id}</div>
              <div><strong>User ID:</strong> ${uid}</div>
              <div><strong>Duration:</strong> ${dur} mins</div>
              <div style="margin-top:8px;">
                <button class="btn btn-sm btn-outline-primary" onclick="updateWorkout('${id}')">Update</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteWorkout('${id}')">Delete</button>
              </div>
            </div>
          </div>`;
      });


      $list.html(cards.join(""));
    },
    error: (xhr, status, error) => {
      console.error("Error loading workouts:", status, error, xhr?.responseText);
      $list.html("<p style='color:red;'>Error loading workouts.</p>");
    },
  });
}


// === Helpers ===
function unwrapMaybeBase64(value) {
  if (value && typeof value === "object" && "$content" in value) {
    try { return atob(value.$content); } catch { return value.$content || ""; }
  }
  return value || "";
}

function buildBlobUrl(filePath) {
  if (!filePath) return "";
  const trimmed = String(filePath).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed; // already absolute
  const left = (BLOB_ACCOUNT || "").replace(/\/+$/g, "");
  const right = trimmed.replace(/^\/+/g, "");
  return `${left}/${right}`;
}

// Only detect videos; everything else is attempted as an image
function isLikelyVideo({ contentType, url, fileName }) {
  const ct = (contentType || "").toLowerCase();
  if (ct.startsWith("video/")) return true;
  const target = ((url || "") + " " + (fileName || "")).toLowerCase();
  return /\.(mp4|m4v|webm|og[gv]|mov|avi)(\?|#|$)/.test(target);
}

// Fallback: if an <img> fails to load, replace it with a link in-place
function imageFallbackToLink(imgEl, url, label) {
  const card = imgEl.closest(".media-card");
  if (!card) return;
  const thumb = card.querySelector(".media-thumb");
  const errMsg = card.querySelector(".image-error");

  if (thumb) {
    thumb.innerHTML = `<a href="${url}" target="_blank" rel="noopener" class="video-link">${label || url}</a>`;
  }
  if (errMsg) {
    errMsg.textContent = "Image failed to load — opened as link instead.";
    errMsg.style.display = "block";
  }
}

// Minimal HTML-escaper for labels
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// === Update an existing workout ===
function updateWorkout(id) {
  const newType = prompt("Enter new workout type:");
  const newDuration = prompt("Enter new duration (minutes):");
  if (!newType || !newDuration) return;

  const body = JSON.stringify({
    id: id,
    userId: "u001",          
    workoutType: newType,
    duration: Number(newDuration),
    imageUrl: `${BLOB_ACCOUNT}/${id}.jpg`,
    isDeleted: false,
  });

  $.ajax({
    url: UPDATE_URI.replace("%7Bid%7D", id),
    type: "PUT",
    data: body,
    contentType: "application/json",
    success: () => {
      alert("Workout updated!");
      getImages(); // refresh list
    },
    error: (xhr, status, err) => {
      console.error("Update failed:", status, err, xhr?.responseText);
      alert("Update failed — see console.");
    },
  });
}

// === delete a workout ===
function deleteWorkout(id) {
  if (!confirm(`Delete workout ${id}?`)) return;

  const body = JSON.stringify({
    id: id,
    userId: "u001",
    workoutType: "deleted",
    duration: 0,
    imageUrl: `${BLOB_ACCOUNT}/${id}.jpg`,
    isDeleted: true,
  });

  $.ajax({
    url: UPDATE_URI.replace("%7Bid%7D", id),
    type: "PUT",
    data: body,
    contentType: "application/json",
    success: () => {
      alert("Workout deleted.");
      getImages();
    },
    error: (xhr, status, err) => {
      console.error("Delete failed:", status, err, xhr?.responseText);
      alert("Delete failed — see console.");
    },
  });
}
