// goal: catch what someone types so a refresh/crash doesn't lose it

// using origin + pathname instead of full href, so query params
// (like google maps constantly changing coords in the url) dont create
// a new key every time
function getPageKey() {
    return window.location.origin + window.location.pathname;
}

// try to figure out a stable-ish identifier for a specific field
// so multiple fields on the same page dont overwrite each others drafts
function getFieldId(field) {
    if (field.name) {
        return "name:" + field.name;
    }
    if (field.id) {
        return "id:" + field.id;
    }
    if (field.placeholder) {
        return "placeholder:" + field.placeholder;
    }

    // last resort - use its position among all text fields on the page.
    // not perfect (ig breaks if page adds/removes fields dynamically) but
    // good enough for now
    const allFields = Array.from(document.querySelectorAll("textarea, input[type='text']"));
    const index = allFields.indexOf(field);
    return "index:" + index;
}

function getStorageKey(field) {
    return getPageKey() + "::" + getFieldId(field);
}

document.addEventListener("input", function (event) {
    const field = event.target;

    const isTextField =
        field.tagName === "TEXTAREA" ||
        (field.tagName === "INPUT" && field.type === "text");

    if (!isTextField) {
        return;
    }

    const key = getStorageKey(field);

    chrome.storage.local.set({ [key]: field.value }, function () {
        console.log("textfall saved draft for", key);
    });
}, true);

// listen for a message from the popup asking us to restore text
// into a specific field, identified by its fieldId
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type !== "RESTORE_DRAFT") {
        return;
    }

    const allFields = Array.from(document.querySelectorAll("textarea, input[type='text']"));

    // find the field whose id matches the one we saved this draft under
    const target = allFields.find(function (field) {
        return getFieldId(field) === message.fieldId;
    });

    if (target) {      
        target.value = message.text;
        // fire input event manually so react-controlled fields etc notice the change
        target.dispatchEvent(new Event("input", { bubbles: true }));
        sendResponse({ success: true });
    } else {
        // page structure changed since we saved this, cant find the field anymore
        sendResponse({ success: false });
    }       
});    