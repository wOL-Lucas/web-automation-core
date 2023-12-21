"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const WebSocket = require('ws');
const cors = require('cors');

class APP{
    constructor(){
        this.sessions = [];
        this.app = express();
        this.app.use(cors());
        this.port = 6901;
        this.app.use(express.static(__dirname + '/public'));
        this.app.use(bodyParser.json());


        this.app.use((req,res,next) =>{
            if(req.path.toLowerCase() === '/api/auth' || req.path.toLowerCase() === '/api/sessions'){
                return next();
            }
            
            const token = req.headers['authorization'].replace('Bearer ', '');
            if(!token){
                return res.status(401).send({error: "No token provided"});
            }

            jwt.verify(token, fs.readFileSync('./auth/secure/secret.pem'), (err, decoded)=>{
                if(err){
                    return res.status(401).send({error: "Invalid token"});
                }
                req.decoded = decoded;
                next();
                }
            )

            next();
        })

        this.app.get('/api/sessions', (req, res)=>{
            console.log("sessions");
            const sessions =  this.sessions;
            console.log(sessions);
            res.status(200).json(sessions);
        });
        
        this.app.post('/api/sessions/', (req, res)=>{
            console.log("NEW POST")
            const id = req.body.id;
            const execute = req.body.execute;

            const session = this.sessions.find((session)=>{return session.id === id})
            console.log(session);

            if(!session){
                return res.status(400).send({error: "Invalid session id"});
            }
            session.socket.send(JSON.stringify({
                type: "execute",
                execute: execute,
            }));
            const result = new Promise((resolve, reject)=>{
                session.socket.on('message', (message)=>{
                    const data = JSON.parse(message);
                    if(data.type === "executeResult"){
                        resolve(data.result);
                    }
                })
            })

            result.then((result)=>{
                res.status(200).send({result: result});
                return
            })

        })

        this.app.post('/api/auth', (req, res)=>{
            const context = req.body.context;
            if(context === "chrome-web-extension"){
                const token = jwt.sign({context: context}, fs.readFileSync('./auth/secure/secret.pem'),{expiresIn: '1h'});
                res.send({token: token});
            }
            else{
                res.status(400).send({error: "Invalid context"});
            }
        })
        
        this.server = (()=>{
            return https.createServer({
                key: fs.readFileSync('./auth/secure/key.pem'),
                cert: fs.readFileSync('./auth/secure/cert.pem'),
            }, this.app);
        })();

        const server = this.server;

        this.wss = new WebSocket.Server({server})
        this.wss.on('connection', (ws) => {
            console.log("connected")
            ws.send(
                JSON.stringify(
                    {
                        "type":"greet",
                        "message":""
                    }
                )
            )

            ws.on('message',(message)=>{
                try{
                    const data = JSON.parse(message);
                    switch(data.type){
                        case "register":
                            this.registerSocket(ws,data);
                            break;

                        default:
                            console.log("new message: ", data);
                            console.log(data.type);
                            break;
                        
                    }
                }
                catch(e){
                    console.log(e);
                    return;
                }
                
            });

            ws.on('test', (message)=>{
                console.log("test: ", message)
            })

            ws.on('close', ()=>{
                console.log("closed");
            });

            ws.on('error', (err)=>{
                console.log(err);
            });

            ws.on('closeTab', (tab)=>{
                console.log(tab)
                this.sessions.splice(this.sessions.indexOf(tab), 1);
            });

        })

        this.startServer = ()=>{
            this.server.listen(this.port, ()=>{
                console.log(`Server listening on port ${this.port}`);
            })
        }



        this.registerSocket = (socket, data) =>{
            const id = data.timestamp.toString() + "--" + data.title;
            var doesExist = this.sessions[id];
            while(doesExist){
                id = id + Math.floor(Math.random() * 1000);
                doesExist = this.sessions[id];
            }

            this.sessions.push({
                id: id,
                url: data.url,
                title: data.title,
                socket: socket,
            })
        }
    }
}


const app = new APP();
app.startServer();