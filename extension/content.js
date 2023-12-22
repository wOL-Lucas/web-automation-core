(() =>{
    console.log(":::web-automation-core inited:::");

    const socket = new WebSocket('wss://localhost:6901');

    const functions = {
        clickOnButton: (className, index=null) =>{
            const buttons = document.getElementsByClassName(className);
            
            console.log(buttons);

            if(buttons.length < 1){
                return 'undefined';
            }

            if (index){
                const button = buttons[index];
                button.click();
                return;
            }

            const button = buttons[0];
            button.click();

            return "clicked";
        },

        getElementInnerHtml: (className,index) =>{
            if (index){
                const element = document.getElementsByClassName(className)[index];
                return element.innerHTML;
            }

            const element = document.getElementsByClassName(className)[0];
            if(element){
                return element.innerHTML;
            }
            
            return 'undefined'
        },

        getElementInnerText: (className, index) =>{
            if (index){
                const element = document.getElementsByClassName(className)[index];
                return element.innerText;
            }

            const element = document.getElementsByClassName(className)[0];
            return element.innerText;
        },

        scrollDown: (to=null) =>{
            if (to){
                window.scrollTo(0,to);
                return;
            }
            window.scrollTo(0,document.body.scrollHeight);
            return;
        },

        scrollUp: (to=null) =>{
            if (to){
                window.scrollTo(0,to);
                return;
            }
            window.scrollTo(0,0);
            return;
        },

        findElementByClassName: (className, index=null) =>{
            if (index){
                return document.getElementsByClassName(className)[index];
            }

            return document.getElementsByClassName(className)[0];
        },

        consoleLog: (message) =>{
            console.log(message);
        },

        getElementByFrameworkAttribute: (attribute, value, index=null) =>{
            const elements = document.querySelectorAll(`\\[${attribute}="${value}"]`);
            if (index){
                return elements[index];
            }
            return elements[0];
        },
    }
    
    socket.onopen = function(e){
        console.log("opened")
        socket.send(JSON.stringify(
            {
                "type":"register",
                "url": document.URL,
                "title": document.title,
                "timestamp": Date.now(),
            }
        ));
    };
    
    socket.onmessage = (e) =>{
        const data = JSON.parse(e.data);
        switch(data.type){
            case "greet":
                console.log("greet");
                break;
    
            case "execute":
                console.log("execute", data.execute)
                if(functions[data.execute.function]){
                    const result = functions[data.execute.function](...data.execute.args);
                    socket.send(JSON.stringify(
                        {
                            "type":"executeResult",
                            "result": result,
                            "id": data.id
                        }
                    ));
                }
                else{
                    console.log("function not found");
                    socket.send(JSON.stringify(
                        {
                            "type":"executeResult",
                            "result": null,
                            "id": data.id
                        }
                    ));
                }
                break;
    
            default:
                console.log("new message: ", data);
                break;
        }
    
    };
    
    socket.onerror = function(e){
        console.log("error ",e);
    };
    
    socket.onclose = function(e){
        console.log("closed ",e);
    };
    
    
})();