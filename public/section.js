const t = window.TrelloPowerUp.iframe();

const TRELLO_KEY = "9c85fa65404b1200d1e41975b2b7e439";

/* -------------------------
   UI ELEMENTS
--------------------------*/

const ui = {
  userInput: document.getElementById("userInput"),
  generateBtn: document.getElementById("generateBtn"),
  outputSection: document.getElementById("outputSection"),
  aiOutput: document.getElementById("aiOutput"),
  attachBtn: document.getElementById("attachBtn"),
  screenshotBtn: document.getElementById("screenshotBtn"),
  insertBtn: document.getElementById("insertBtn"),
  copyBtn: document.getElementById("copyBtn"),
  insertDescBtn: document.getElementById("insertDescBtn")
};

const attachmentsSection = document.getElementById("attachmentsSection");
const fileList = document.getElementById("fileList");
const processingScreen = document.getElementById("processingScreen");
const processingScreenshots = document.getElementById("processingScreenshots");
const processingChars = document.getElementById("processingChars");

let uploadedFiles = [];

/* -------------------------
   RESIZE TRELLO IFRAME
--------------------------*/

const resize = () => {
  t.sizeTo("#main-wrapper").done();
};

window.addEventListener("load", resize);

if (ui.userInput) {
  ui.userInput.addEventListener("input", resize);
  ui.aiOutput.addEventListener("input", resize);
}

/* -------------------------
   FILE PICKER
--------------------------*/

function openFilePicker(e) {
  e.preventDefault();

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;

  input.onchange = () => {
    const files = Array.from(input.files);

    files.forEach(file => {

      uploadedFiles.push(file);

      const fileItem = document.createElement("div");

      fileItem.className =
        "flex items-center justify-between bg-[#22272b] border border-[#38414a] rounded p-2 text-xs";

      fileItem.innerHTML = `
        <div class="flex items-center gap-2">
          <span>🖼️</span>
          <span>${file.name}</span>
        </div>
        <button class="text-red-400 hover:text-red-300 text-[10px]">Remove</button>
      `;

      fileItem.querySelector("button").onclick = () => {

        uploadedFiles = uploadedFiles.filter(f => f !== file);
        fileItem.remove();

        if (uploadedFiles.length === 0) {
          attachmentsSection.classList.add("hidden");
        }

        resize();
      };

      fileList.appendChild(fileItem);
    });

    attachmentsSection.classList.remove("hidden");

    t.alert({
      message: `${files.length} file(s) added`,
      duration: 2
    });

    resize();
  };

  input.click();
}

if (ui.attachBtn) ui.attachBtn.addEventListener("click", openFilePicker);
if (ui.screenshotBtn) ui.screenshotBtn.addEventListener("click", openFilePicker);

/* -------------------------
   AI GENERATION
--------------------------*/

if (ui.generateBtn) {
ui.generateBtn.onclick = async () => {

  const promptText = ui.userInput.value.trim();

  if (!promptText) {
    return t.alert({
      message: "Please type something first!",
      duration: 2
    });
  }

  const apiKey = await t.get("member", "private", "apiKey");

  if (!apiKey) {

    t.alert({
      message: "Please configure your API key.",
      duration: 3
    });

    return t.popup({
      title: "Comment AI Settings",
      url: "./settings.html",
      height: 250
    });
  }

  ui.outputSection.classList.add("hidden");
  processingScreen.classList.remove("hidden");
  ui.generateBtn.disabled = true;

  resize();

  try {

    const formData = new FormData();
    formData.append("prompt", promptText);
    formData.append("apiKey", apiKey);

    uploadedFiles.forEach(file => {
      formData.append("screenshots", file);
    });

    const response = await fetch(
      "https://trello-commentai.onrender.com/generate",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    ui.aiOutput.value = data.text || "No response returned.";

    ui.outputSection.classList.remove("hidden");

  } catch (err) {

    console.error(err);

    t.alert({
      message: "Service temporarily unavailable.",
      duration: 5
    });

  } finally {

    processingScreen.classList.add("hidden");
    ui.generateBtn.disabled = false;
    resize();
  }

};
}

/* -------------------------
   COPY TEXT
--------------------------*/

function copyText(text) {

  try {

    const textarea = document.createElement("textarea");

    textarea.value = text;

    document.body.appendChild(textarea);
    textarea.select();

    document.execCommand("copy");

    document.body.removeChild(textarea);

    t.alert({
      message: "Copied!",
      duration: 2
    });

  } catch (err) {

    console.error(err);

    t.alert({
      message: "Copy failed",
      duration: 3
    });
  }
}

if (ui.copyBtn) {
  ui.copyBtn.onclick = () => {
   copyText(ui.aiOutput.value);
  };
}

/* -------------------------
   INSERT AS COMMENT
--------------------------*/
async function getToken() {

  let token = await t.get("member", "private", "token");
  if (token) return token;

  const returnUrl = window.location.origin + "/token-success.html";

  const authUrl =
    `https://trello.com/1/authorize?expiration=never&name=CommentAI&scope=read,write&response_type=token&key=${TRELLO_KEY}&return_url=${encodeURIComponent(returnUrl)}`;

  token = await t.authorize(authUrl, {
    height: 680,
    width: 580,
    validToken: /.+/
  });

  await t.set("member", "private", "token", token);

  return token;
}

async function insertComment() {

  const text = ui.aiOutput.value;
  if (!text) return;

  const token = await getToken();
  const card = await t.card("id");

  await fetch(
    `https://api.trello.com/1/cards/${card.id}/actions/comments?key=${TRELLO_KEY}&token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    }
  );

  t.alert({
    message: "Comment added",
    duration: 3
  });
}

ui.insertBtn.onclick = insertComment;

/* -------------------------
   INSERT AS DESCRIPTION
--------------------------*/

if (ui.insertDescBtn) {
ui.insertDescBtn.onclick = async () => {

  const text = ui.aiOutput.value;
  if (!text) return;

  const token = await getToken();
  const card = await t.card("id");

  await fetch(
    `https://api.trello.com/1/cards/${card.id}?key=${TRELLO_KEY}&token=${token}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        desc: text
      })
    }
  );

  t.alert({
    message: "Description updated",
    duration: 3
  });
};
}


/* -------------------------
   ENTER TO SEND
--------------------------*/

ui.userInput.addEventListener("keydown", function (e) {

  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    if (!ui.generateBtn.disabled) {
      ui.generateBtn.click();
    }
  }

});

/* -------------------------
   QUICK ACTIONS
--------------------------*/

const suggestBtn = document.getElementById("suggestBtn");
const subtasksBtn = document.getElementById("subtasksBtn");

if (suggestBtn) {

  suggestBtn.onclick = () => {

    const text = ui.userInput.value.trim();

    ui.userInput.value =
      "Suggest improvements for the following task or description:\n\n" + text;

    ui.generateBtn.click();
  };

}

if (subtasksBtn) {

  subtasksBtn.onclick = () => {

    const text = ui.userInput.value.trim();

    ui.userInput.value =
      "Break this task into clear actionable subtasks:\n\n" + text;

    ui.generateBtn.click();
  };

}