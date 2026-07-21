// this file gets injected into every page we visit.
// goal: catch what someone types so a refresh/crash doesn't lose it

// using origin + pathname instead of full href now, so query params
// (like google maps constantly changing coords in the url) dont create
// a new key every time. still not perfect but way less noisy
function getStorageKey() {
    return window.location.origin + window.location.pathname;
}

document.addEventListener("input", function (event) {
    const field = event.target;

    // only care about actual text fields, not checkboxes/buttons etc
    const isTextField =
        field.tagName === "TEXTAREA" ||
        (field.tagName === "INPUT" && field.type === "text");

    if (!isTextField) {
        return;
    }

    const key = getStorageKey();

    chrome.storage.local.set({ [key]: field.value }, function () {
        // checking it if saves
        console.log("textfall saved draft for", key);
    });
}, true);

// listen for a message from the popup asking us to restore text
// into whichever text field is currently focused/last used on the page
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type !== "RESTORE_DRAFT") {
        return;
    }

    // find the currently focused element, fall back to first text field on page
    let target = document.activeElement;

    const isValidTarget =
        target &&
        (target.tagName === "TEXTAREA" ||
            (target.tagName === "INPUT" && target.type === "text"));

    if (!isValidTarget) {
        // nothing focused, just grab the first text input we can find
        target = document.querySelector("textarea, input[type='text']");
    }

    if (target) {
        target.value = message.text;
        // manually fire an input event so any site-side listeners (like
        // react controlled inputs) notice the change too
        target.dispatchEvent(new Event("input", { bubbles: true }));
        sendResponse({ success: true });
    } else {
        sendResponse({ success: false });
    }
});