//for now we're just trying to detect typing and not saving anything yuet
//listen for input events anywhereo n the page (using capture so it catches
//stuff inside nested elements aswell

document.addEventListener("input",function(event){
    const field = event.target;
    // only care abuot actual text fields and not checkboxes/buttons etc
    const isTextField = 
    field.tagName   === "TEXTAREA" ||
    (field.tagName === "INPUT" && field.type === "text");

    if (!isTextField){
        return;      
        
    }
    // using page url as key for now
    //will change it later when fields are needed to be tracked seperately form same page
    const key = window.location.href;
    chrome.storage.local.set({[key]: field.value},function(){
        //checking it if saves
        console.log("textfall saved draft for",key);
    });
   
},true);        
                                    