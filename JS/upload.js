// === FitCloud Upload Script ===

// Logic App endpoint (CREATE)
const LOGIC_APP_URL =
  "https://prod-24.uksouth.logic.azure.com:443/workflows/f4c12b150cfc478bb1e706e74a0dc6cc/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=HjRrfLSByHoV2MJw_LzLe438x6qXec-Y1Lf5Zqt1nBg";

// Form + UI elements
const form = document.getElementById("uploadForm");
const messageBox = document.getElementById("messageBox");

// === Helper: show success or error messages ===
function showMessage(text, type = "success") {
  messageBox.classList.remove(
    "hidden",
    "bg-green-100",
    "bg-red-100",
    "text-green-800",
    "text-red-800"
  );
  if (type === "success") {
    messageBox.classList.add("bg-green-100", "text-green-800");
  } else {
    messageBox.classList.add("bg-red-100", "text-red-800");
  }
  messageBox.textContent = text;
  setTimeout(() => messageBox.classList.add("hidden"), 4000);
}

// === Helper: auto-generate IDs ===
function generateIds() {
  const workoutId = "w" + Date.now();
  const userId = "u" + Math.floor(Math.random() * 10000);
  return { workoutId, userId };
}

// === Helper: safely convert file to Base64 ===
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(",")[1]; // strip "data:..." prefix
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// === Submit handler ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Collect form values
  const workoutType = document.getElementById("workoutType").value.trim();
  const duration = parseInt(document.getElementById("duration").value.trim(), 10);
  const description = document.getElementById("description").value.trim();
  const mediaFile = document.getElementById("mediaFile").files[0];

  // Validate required fields
  if (!workoutType || !duration || !mediaFile) {
    showMessage("Please complete all required fields.", "error");
    return;
  }

  const { workoutId, userId } = generateIds();
  showMessage("Uploading to FitCloud...", "success");

  try {
    // Convert file to Base64 string
    const fileBase64 = await fileToBase64(mediaFile);

    // Construct payload for Logic App
    const payload = {
      id: workoutId,
      userId,
      workoutType,
      duration,
      description,
      FileName: mediaFile.name,
      File: fileBase64,
    };

    console.log("Uploading payload:", payload);

    // Send POST to Logic App
    const response = await fetch(LOGIC_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Handle response
    if (response.ok) {
      showMessage("Workout uploaded successfully!");
      form.reset();
      console.log("Upload success");
    } else {
      const errorText = await response.text();
      console.error( "Upload failed:", errorText);
      showMessage("Upload failed — check console for details.", "error");
    }
  } catch (err) {
    console.error("Error connecting to server:", err);
    showMessage("Error connecting to server.", "error");
  }
});
