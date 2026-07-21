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

    //logging in console for now we can see it working in devtools console
    console.log("textfall detected typing", field.value);
},true);
                  