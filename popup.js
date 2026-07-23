// when the popup opens, find every saved draft belonging to the current
// page (there can be more than one now, one per field)

function getPageKeyFromUrl(url) {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
}

// turns milliseconds into a rough "5 minutes ago" style string
function timeAgo(timestampMs) {
    const diffMs = Date.now() - timestampMs;
    const diffMins = Math.floor(diffMs / 60000); 

    if (diffMins < 1) {
        return "just now";
    }
    if (diffMins < 60) {
        return diffMins + " min ago";
    }
    const diffHours = Math.floor(diffMins / 60);
    return diffHours + "h ago";
}

// turns a fieldId like "placeholder:Search Google Maps" or "name:smtg" into
// something readable to show as a little label on each draft block
function getReadableLabel(fieldId) {
    const [kind, value] = fieldId.split(":");

    if (kind === "placeholder") {                 
        return value;
    }
    if (kind === "name" || kind === "id") {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
   
    return "Field " + (parseInt(value, 10) + 1);
}                
       
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    const pageKey = getPageKeyFromUrl(currentTab.url);

    chrome.storage.local.get(null, function (allItems) {
        const container = document.querySelector("#drafts-container");
        const emptyMsg = document.querySelector(".empty-msg");
        const countEl = document.querySelector("#draft-count");

        const matchingKeys = Object.keys(allItems).filter(function (key) {
            return key.indexOf(pageKey + "::") === 0;
        });

        const realDrafts = matchingKeys.filter(function (key) {    
            const item = allItems[key];   
            return item && item.text && item.text.trim().length > 0;
        });

        if (realDrafts.length === 0) {
            return;
        }

        emptyMsg.style.display = "none";
        countEl.textContent = realDrafts.length + (realDrafts.length === 1 ? " draft" : " drafts");

        realDrafts.forEach(function (key) {
            const fieldId = key.split("::")[1];
            const draft = allItems[key];

            const draftBlock = document.createElement("div");
            draftBlock.className = "draft-block";

            //  field label on the left, delete (x) on the right
            const topRow = document.createElement("div");
            topRow.className = "draft-top-row";

            const labelEl = document.createElement("span");
            labelEl.className = "draft-label";
            labelEl.textContent = getReadableLabel(fieldId);

            const deleteBtn = document.createElement("button");      
            deleteBtn.className = "delete-btn";
            deleteBtn.textContent = "X";
            deleteBtn.title = "Delete this draft";

            topRow.appendChild(labelEl);
            topRow.appendChild(deleteBtn);

            const textEl = document.createElement("p");
            textEl.className = "draft-text";
            textEl.textContent = draft.text;

            const timeEl = document.createElement("span");
            timeEl.className = "draft-time";
            timeEl.textContent = timeAgo(draft.savedAt);

            const restoreBtn = document.createElement("button");
            restoreBtn.className = "restore-btn";
            restoreBtn.textContent = "Restore";

            restoreBtn.addEventListener("click", function () {
                chrome.tabs.sendMessage(
                    currentTab.id,
                    { type: "RESTORE_DRAFT", text: draft.text, fieldId: fieldId },
                    function (response) {
                        console.log("restore response:", response);
                    }
                );
            });

            // deleting just removes this one key from storage and pulls
            // the block out of the popup, then updates the count
            deleteBtn.addEventListener("click", function () {
                chrome.storage.local.remove(key, function () {
                    draftBlock.remove();

                    const remaining = document.querySelectorAll(".draft-block").length;
                    if (remaining === 0) {
                        emptyMsg.style.display = "block";
                        countEl.textContent = "";
                    } else {
                        countEl.textContent = remaining + (remaining === 1 ? " draft" : " drafts");
                    }
                });
            });

            draftBlock.appendChild(topRow);
            draftBlock.appendChild(textEl);
            draftBlock.appendChild(timeEl);
            draftBlock.appendChild(restoreBtn);
            container.appendChild(draftBlock);
        });
    });
});