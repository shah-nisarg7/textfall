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

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    const pageKey = getPageKeyFromUrl(currentTab.url);

    chrome.storage.local.get(null, function (allItems) {
        const container = document.querySelector("#drafts-container");
        const emptyMsg = document.querySelector(".empty-msg");

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

        realDrafts.forEach(function (key) {
            const fieldId = key.split("::")[1];
            const draft = allItems[key];     

            const draftBlock = document.createElement("div");
            draftBlock.className = "draft-block";

            const textEl = document.createElement("p");
            textEl.className = "draft-text";
            textEl.textContent = draft.text;

            // small timestamp line, just so it feels alive and not static
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
      
            draftBlock.appendChild(textEl);
            draftBlock.appendChild(timeEl);
            draftBlock.appendChild(restoreBtn);
            container.appendChild(draftBlock);
        });        
    });
});     