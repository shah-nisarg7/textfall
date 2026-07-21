//when popup opens, figuring out which tab we're looking at
// and check if we have a saved draft for that tab

chrome.tabs.query({active: true,currentWindow:true}, function(tabs){
    const currentTab = tabs[0];
    const key = currentTab.url;

    chrome.storage.local.get(key,function(result){
        const draftText = result[key];
        const messageE1 = document.querySelector(".empty-msg");

        if (draftText && draftText.trim().length>0){
            //we have something saved, show it instead of placeholder
            messageE1.textContent = draftText;
        
        }
        // if nothing saved, leave the "nothing saved yet"

    });

});