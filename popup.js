// when the popup opens, find every saved draft belonging to the current
// page (there can be more than one now, one per field)

function getPageKeyFromUrl(url) {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
}

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    const pageKey = getPageKeyFromUrl(currentTab.url);

    // storage doesnt have "get by prefix" directly, so we grab everything
    // and filter down to keys that start with this page's key
    chrome.storage.local.get(null, function (allItems) {
        const container = document.querySelector("#drafts-container");
        const emptyMsg = document.querySelector(".empty-msg");

        const matchingKeys = Object.keys(allItems).filter(function (key) {
            return key.indexOf(pageKey + "::") === 0;
        });

        // filter out empty drafts too, same as before
        const realDrafts = matchingKeys.filter(function (key) {
            return allItems[key] && allItems[key].trim().length > 0;
        });

        if (realDrafts.length === 0) {
            // leaving the default "nothing saved yet" message showing
            return;
        }

        // we have at least one real draft, hide the empty message
        emptyMsg.style.display = "none";

        realDrafts.forEach(function (key) {
            const fieldId = key.split("::")[1];
            const draftText = allItems[key];

            // build one little block per draft.. the text + a restore button
            const draftBlock = document.createElement("div");
            draftBlock.className = "draft-block";

            const textEl = document.createElement("p");
            textEl.className = "draft-text";
            textEl.textContent = draftText;

            const restoreBtn = document.createElement("button");
            restoreBtn.className = "restore-btn";
            restoreBtn.textContent = "Restore";

            restoreBtn.addEventListener("click", function () {
                chrome.tabs.sendMessage(
                    currentTab.id,
                    { type: "RESTORE_DRAFT", text: draftText, fieldId: fieldId },
                    function (response) {
                        console.log("restore response:", response);
                    }
                );
            });

            draftBlock.appendChild(textEl);
            draftBlock.appendChild(restoreBtn);
            container.appendChild(draftBlock);
        });
    });
});