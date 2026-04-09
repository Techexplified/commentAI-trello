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
  insertBtn: document.getElementById("insertBtn"),
  copyBtn: document.getElementById("copyBtn"),
  insertDescBtn: document.getElementById("insertDescBtn"),
  filterSelect: document.getElementById("filterSelect"),
  templateSelect: document.getElementById("templateSelect"),
  suggestBtn: document.getElementById("suggestBtn"),
  subtasksBtn: document.getElementById("subtasksBtn")
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
      fileItem.className = "log-item"; 
      fileItem.style.justifyContent = "space-between";
      fileItem.style.background = "var(--bg-panel)";
      fileItem.style.padding = "6px 8px";
      fileItem.style.borderRadius = "4px";
      fileItem.style.border = "1px solid var(--border-color)";

      fileItem.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>🖼️</span>
          <span>${file.name}</span>
        </div>
        <button style="color: #f87171; background: none; border: none; cursor: pointer; font-size: 10px;">Remove</button>
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
    t.alert({ message: `${files.length} file(s) added`, duration: 2 });
    resize();
  };

  input.click();
}

if (ui.attachBtn) ui.attachBtn.addEventListener("click", openFilePicker);

/* -------------------------
   AI GENERATION
--------------------------*/
if (ui.generateBtn) {
  ui.generateBtn.onclick = async () => {
    
    let promptText = ui.userInput.value.trim();

    if (!promptText && uploadedFiles.length === 0) {
      return t.alert({ message: "Please type something or attach a screenshot first!", duration: 2 });
    }

    if (!promptText && uploadedFiles.length > 0) {
      promptText = "Please analyze the attached image(s).";
    }

    let finalPrompt = promptText;

    if (ui.filterSelect && ui.filterSelect.value) {
      const filterText = ui.filterSelect.options[ui.filterSelect.selectedIndex].text;
      finalPrompt += `\n\nFormat Requirement: Make the response ${filterText}.`;
    }

    if (ui.templateSelect && ui.templateSelect.value) {
      const templateText = ui.templateSelect.options[ui.templateSelect.selectedIndex].text;
      finalPrompt += `\n\nTone/Style Requirement: Use a ${templateText} style.`;
    }

    const apiKey = await t.get("member", "private", "apiKey");

    if (!apiKey) {
      t.alert({ message: "Please configure your API key.", duration: 3 });
      return t.popup({ title: "Comment AI Settings", url: "./settings.html", height: 480 });
    }

    ui.outputSection.classList.add("hidden");
    processingScreen.classList.remove("hidden");
    ui.generateBtn.disabled = true;
    
    if (processingScreenshots) processingScreenshots.innerText = `• ${uploadedFiles.length} screenshots attached`;
    if (processingChars) processingChars.innerText = `• ${finalPrompt.length} characters of context provided`;

    resize();

    try {
      const formData = new FormData();
      formData.append("prompt", finalPrompt); 
      formData.append("apiKey", apiKey);

      uploadedFiles.forEach(file => {
        formData.append("screenshots", file);
      });

      const response = await fetch("https://trello-commentai.onrender.com/generate", {
        method: "POST",
        body: formData
      });
      

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server returned status ${response.status}`);
      }

      ui.aiOutput.value = data.text || "No response returned.";
      ui.outputSection.classList.remove("hidden");

    } catch (err) {
      console.error("Caught Error:", err);
      
      // FIXED: Trello alerts crash if the message is over 140 characters. This truncates it safely.
      let safeMessage = `API Error: ${err.message}`;
      if (safeMessage.length > 135) {
        safeMessage = safeMessage.substring(0, 135) + "...";
      }
      
      t.alert({ message: safeMessage, duration: 6, display: 'error' });
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
    t.alert({ message: "Copied to clipboard!", duration: 2 });
  } catch (err) {
    console.error(err);
    t.alert({ message: "Copy failed", duration: 3 });
  }
}

if (ui.copyBtn) {
  ui.copyBtn.onclick = () => {
    copyText(ui.aiOutput.value);
  };
}

/* -------------------------
   INSERT ACTIONS (COMMENT & DESC)
--------------------------*/
async function getToken() {
  let token = await t.get("member", "private", "token");
  if (token) return token;

  const returnUrl = window.location.origin + "/token-success.html";
  const authUrl = `https://trello.com/1/authorize?expiration=never&name=CommentAI&scope=read,write&response_type=token&key=${TRELLO_KEY}&return_url=${encodeURIComponent(returnUrl)}`;

  token = await t.authorize(authUrl, { height: 680, width: 580, validToken: /.+/ });
  await t.set("member", "private", "token", token);
  return token;
}

if (ui.insertBtn) {
  ui.insertBtn.onclick = async () => {
    const text = ui.aiOutput.value;
    if (!text) return;

    try {
      const token = await getToken();
      const card = await t.card("id");

      await fetch(`https://api.trello.com/1/cards/${card.id}/actions/comments?key=${TRELLO_KEY}&token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      t.alert({ message: "Comment added successfully", duration: 3 });
    } catch (err) {
      console.error("Error inserting comment:", err);
      t.alert({ message: "Failed to add comment. Check authentication.", duration: 3 });
    }
  };
}

if (ui.insertDescBtn) {
  ui.insertDescBtn.onclick = async () => {
    const text = ui.aiOutput.value;
    if (!text) return;

    try {
      const token = await getToken();
      const card = await t.card("id");

      await fetch(`https://api.trello.com/1/cards/${card.id}?key=${TRELLO_KEY}&token=${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desc: text })
      });

      t.alert({ message: "Description updated", duration: 3 });
    } catch (err) {
      console.error("Error updating description:", err);
      t.alert({ message: "Failed to update description.", duration: 3 });
    }
  };
}

/* -------------------------
   ENTER TO SEND
--------------------------*/
if (ui.userInput) {
  ui.userInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!ui.generateBtn.disabled) {
        ui.generateBtn.click();
      }
    }
  });
}

/* -------------------------
   QUICK ACTIONS
--------------------------*/
if (ui.suggestBtn) {
  ui.suggestBtn.onclick = () => {
    const text = ui.userInput.value.trim();
    ui.userInput.value = "Suggest improvements for the following task or description:\n\n" + text;
    ui.generateBtn.click();
  };
}

if (ui.subtasksBtn) {
  ui.subtasksBtn.onclick = () => {
    const text = ui.userInput.value.trim();
    ui.userInput.value = "Break this task into clear actionable subtasks:\n\n" + text;
    ui.generateBtn.click();
  };
}