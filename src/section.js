const t = window.TrelloPowerUp.iframe();

const ui = {
    userInput: document.getElementById('userInput'),
    generateBtn: document.getElementById('generateBtn'),
    outputSection: document.getElementById('outputSection'),
    aiOutput: document.getElementById('aiOutput'),
    attachBtn: document.getElementById('attachBtn'),
    screenshotBtn: document.getElementById('screenshotBtn'),
    insertBtn: document.getElementById('insertBtn'),
    copyBtn: document.getElementById('copyBtn')
};


const resize = () => t.sizeTo('body').done();
window.addEventListener('load', resize);

if (ui.userInput) ui.userInput.addEventListener('input', resize);



const attachmentsSection = document.getElementById("attachmentsSection");
const fileList = document.getElementById("fileList");

let uploadedFiles = [];

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
            };

            fileList.appendChild(fileItem);
        });

        attachmentsSection.classList.remove("hidden");

        t.alert({
            message: `${files.length} file(s) added`,
            duration: 2
        });
    };

    input.click();
}

if (ui.attachBtn) ui.attachBtn.addEventListener("click", openFilePicker);
if (ui.screenshotBtn) ui.screenshotBtn.addEventListener("click", openFilePicker);




/* -------------------------
   AI GENERATION
--------------------------*/
if (ui.generateBtn) {

    ui.generateBtn.onclick = async function() {

        const promptText = ui.userInput.value.trim();

        if (!promptText)
            return t.alert({ message: "Please type something first!", duration: 2 });

        ui.generateBtn.innerText = "Processing...";
        ui.generateBtn.disabled = true;

        try {

            const apiKey = await t.get("member", "private", "apiKey");

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

            ui.aiOutput.innerText = data.text || "No response returned.";
            ui.outputSection.classList.remove("hidden");

            resize();

        } catch (err) {

            console.error(err);

            t.alert({
                message: "Service temporarily unavailable.",
                duration: 5
            });

        } finally {

            ui.generateBtn.innerText = "Ask Comment AI";
            ui.generateBtn.disabled = false;

        }

    };

}


/* -------------------------
   UTILITIES
--------------------------*/

if (ui.copyBtn) {
    ui.copyBtn.onclick = () => {
        navigator.clipboard.writeText(ui.aiOutput.innerText);
        t.alert({ message: "Copied!", duration: 2 });
    };
}

if (ui.insertBtn) {
    ui.insertBtn.onclick = () => {
        navigator.clipboard.writeText(ui.aiOutput.innerText);
        t.alert({ message: "Copied! Paste it in the Activity box below.", duration: 5 });
    };
}