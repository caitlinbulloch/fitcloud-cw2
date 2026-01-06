// === FitCloud Upload Script ===

const form = document.getElementById("uploadForm");
const messageBox = document.getElementById("messageBox");
const videoUpload = document.getElementById("videoUpload");
const audioUpload = document.getElementById("audioUpload");
const videoFileInput = document.getElementById("videoFile");
const audioFileInput = document.getElementById("audioFile");

// Logic App endpoint
const LOGIC_APP_URL = "https://prod-24.uksouth.logic.azure.com:443/workflows/f4c12b150cfc478bb1e706e74a0dc6cc/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=HjRrfLSByHoV2MJw_LzLe438x6qXec-Y1Lf5Zqt1nBg";

// UI message helper
function showMessage(text, type = "success") {
  messageBox.classList.remove("hidden", "bg-green-100", "bg-red-100", "text-green-800", "text-red-800");
  if (type === "success") {
    messageBox.classList.add("bg-green-100", "text-green-800");
  } else {
    messageBox.classList.add("bg-red-100", "text-red-800");
  }
  messageBox.textContent = text;
  setTimeout(() => messageBox.classList.add("hidden"), 4000);
}

// Auto-generate IDs
function generateIds() {
  const workoutId = "w" + Date.now();
  const userId = "u" + Math.floor(Math.random() * 10000);
  return { workoutId, userId };
}

// File picker click handlers
videoUpload.addEventListener("click", () => videoFileInput.click());
audioUpload.addEventListener("click", () => audioFileInput.click());

// Form submit handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const workoutType = document.getElementById("workoutType").value.trim();
    const duration = parseInt(document.getElementById("duration").value.trim(), 10);
    const description = document.getElementById("description").value.trim();
    const videoFile = document.getElementById("videoFile").files[0];
    const audioFile = document.getElementById("audioFile").files[0];
    const mediaFile = videoFile || audioFile;


  if (!workoutType || !duration || (!videoFile && !audioFile)) {
    showMessage("Please complete all required fields.", "error");
    return;
  }

  const { workoutId, userId } = generateIds();

  showMessage("Uploading to FitCloud...", "success");

  try {
    const formData = new FormData();
    formData.append("id", workoutId);
    formData.append("userId", userId);
    formData.append("workoutType", workoutType);
    formData.append("duration", duration);
    formData.append("description", description);
    formData.append("File", mediaFile);
    formData.append("FileName", mediaFile.name);


    const response = await fetch(LOGIC_APP_URL, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      showMessage("Workout uploaded successfully!");
      form.reset();
    } else {
      showMessage("Upload failed — check console for details.", "error");
      console.error(await response.text());
    }
  } catch (err) {
    console.error(err);
    showMessage("Error connecting to server.", "error");
  }
});
