console.log(":::web-automation-core inited:::");

var socket = new WebSocket('wss://localhost:6901');

socket.onopen = function(e){
    socket.send('newTab', {id: generateId(), title: document.title, url: document.URL, context: "chrome-web-extension", type: "chrome"});
};

socket.onmessage = (e) =>{
    console.log(e);
};

socket.onerror = function(e){
    console.log("error ",e);
};

socket.onclose = function(e){
    socket.emit('closeTab', {id: generateId(), title: document.title, url: document.URL, context: "chrome-web-extension", type: "chrome"});
};


const generateId = () => {
    const request = new XMLHttpRequest();
    request.open('GET', 'https://localhost:6901/api/sessions', false);
    request.onreadystatechange = () => {
        if (request.status == 200){
            var sessions = JSON.parse(request.responseText).sessions;

            var id = document.title;
            for(var i; i < sessions.length; i++){
                console.log(sessions[i].id)
                if(sessions[i].id == id){
                    id = id + Math.floor(Math.random() * 1000);
                }
            }
        
            return id
        }
        else{
            console.log(":::[web-automation-core] : Could not generate session id :::");
            throw new Error(":::[web-automation-core] : Could not generate session id :::");
        }
    }
    request.send();
}