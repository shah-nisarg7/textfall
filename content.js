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
    
    // last resort is to  use its position among all text fields on the page.
    // not perfect (ig breaks if page adds/removes fields dynamically) but
    // good enough for now
    const allFields = getAllTextFields();
    const index = allFields.indexOf(field);
    return "index:" + index;
}

function getStorageKey(field) {
    return getPageKey()  + "::" + getFieldId(field);
}


//taking every text field on page using field.type 
//(bcs some sites werent working with css selector eg google maps)

function getAllTextFields(){
    return Array.from(document.querySelectorAll("textarea,input")).filter(function(field){
        return field.tagName === "TEXTAREA" || field.type === "text";
    });      

}
//putting a little visual marker on af ield so we can notice it has a saved draft
//without needing to open the popup at all

function markFieldAsSaved(field){
    field.style.borderLeft = "3px solid #4CAF50";
}

// goes through every text field currently on the page and chekcs storage
//to see if any of them already have a draft - runs once when page loads
function markExistingDrafts() {
    const allFields = getAllTextFields();
    allFields.forEach(function (field) {
        const key = getStorageKey(field);

        chrome.storage.local.get(key, function (result) {
            const draft = result[key];
            // only mark it if theres actually real text saved, not empty
            if (draft && draft.text && draft.text.trim().length > 0) {
                markFieldAsSaved(field);
            }
        });
    });
}
//running it sometime later andletting the page load its fields 
setTimeout(markExistingDrafts,500);
document.addEventListener("input", function (event) {
    const field = event.target;

    const isTextField =
        field.tagName === "TEXTAREA" ||
        (field.tagName === "INPUT" && field.type === "text");          

    if (!isTextField) {
        return;
    }     
const key = getStorageKey(field);

    // storing an object now instead of a plain string, so we can track
    // when it was saved (needed for the cleanup alarm in background.js)        
    const draftData = {
        text: field.value,
        savedAt: Date.now()
    };

    chrome.storage.local.set({ [key]: draftData }, function () {
        console.log("textfall saved draft for", key);
    });
    //marking it right away asw, not waiting for page to reload
    markFieldAsSaved(field);
}, true);                    

// listen for a message from the popup asking us to restore text
// into a specific field, identified by its fieldId
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log("textfall got a msg",message);
    if (message.type !== "RESTORE_DRAFT") {   
        return;
    }

    const allFields = getAllTextFields();
     
    // find the field whose id matches the one we saved this draft under
    const target = allFields.find(function (field) {               
        return getFieldId(field) === message.fieldId;     
    });

    
    if(target){
        const isTextArea = target.tagName === "TEXTAREA";
        const prototype = isTextArea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype,"value").set;
        nativeValueSetter.call(target,message.text);

        //for non react pages
        target.dispatchEvent(new Event("input",{bubbles:true}));
        sendResponse({success:true});
     
    }      
    else {  
        // page structure changed since we saved this, cant find the field anymore
        sendResponse({ success: false });
    }                             
                        
});                                    