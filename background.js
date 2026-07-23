//runs in bg, not tied to any single tab or popup being open

//set up a recurring alarm when the extensino first installs/loads

chrome.runtime.onInstalled.addListener(function(){
    //1 min is minimum time we can check
    // but every 60m works

    chrome.alarms.create("cleanupOldDrafts",{periodInMinutes:60});


});

//how long a draft is allowed to live before we consider it useless/delete it

const MAX_DRAFT_AGE_MS = 24*60*60*1000// counting 24 hrs

chrome.alarms.onAlarm.addListener(function(alarm){

    if (alarm.name !== "cleanupOldDrafts"){
        return;

    }

    chrome.storage.local.get(null,function(allItems){
        const now  = Date.now();
        const keysToRemove = [];

        Object.keys(allItems).forEach(function(key){
            const item = allItems[key];
            //older drafts (before we added timestamps) might be useless
            //skipping those
            if (!item || typeof item !== "object" || !item.savedAt){
                return;

            }

            const age = now-item.savedAt;
            if(age> MAX_DRAFT_AGE_MS){

                keysToRemove.push(key);
            }


        });

        if (keysToRemove.length>0){

            chrome.storage.local.remove(keysToRemove,function(){
                console.log("textfall cleaned up",keysToRemove.length,"old drafts");

            });
        }

    });
});