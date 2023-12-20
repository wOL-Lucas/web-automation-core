chrome.tabs.onCreated.addListener((tab) => {
    chrome.scripting.executeScript({
        target:{ tabId: tab.id },
        files:["content.js"]
    }).then(
        ()=>{
            console.log("Injected content.js")
        }
    )
})
