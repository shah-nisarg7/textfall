// when the popup opens, figure out which tab we're looking at
// and check if we have a saved draft for it

function getStorageKeyFromUrl(url) {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
}

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    const key = getStorageKeyFromUrl(currentTab.url);

    chrome.storage.local.get(key, function (result) {
        const draftText = result[key];
        const messageEl = document.querySelector(".empty-msg");
        const restoreBtn = document.querySelector("#restore-btn");

        if (draftText && draftText.trim().length > 0) {
            messageEl.textContent = draftText;
            // only show the restore button if we actually have something to restore
            restoreBtn.style.display = "block";

            restoreBtn.addEventListener("click", function () {
                chrome.tabs.sendMessage(
                    currentTab.id,
                    { type: "RESTORE_DRAFT", text: draftText },
                    function (response) {
                        // not doing much with the response yet, just logging
                        // for now so i can see if it worked
                        console.log("restore response:", response);
                    }
                );
            });
        }
        // if nothing saved, leave the "nothing saved yet" text as-is
        // and the button stays hidden
    });
});