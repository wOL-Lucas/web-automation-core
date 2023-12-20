"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const WebSocket = require('ws');
const cors = require('cors');

class extensionSession{
    constructor(ip, id, url, context){
        this.ip = ip
        this.id = id
        this.url = url
        this.context = context
    }
}


class APP{
    constructor(){
        this.app = express();
        this.app.use(cors());
        this.port = 6901;
        this.app.use(express.static(__dirname + '/public'));
        this.app.use(bodyParser.json());

        this.sessions = [];

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
            res.json({sessions: this.sessions});
        });
        
        this.app.get('/api/ws/', (req, res)=>{

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
            ws.on('message',(message)=>{
                
            });

            ws.on('close', ()=>{
                console.log("closed");
            });

            ws.on('error', (err)=>{
                console.log(err);
            });

            ws.on('newTab', (tab)=>{
                console.log(tab)
                this.sessions.push(new extensionSession(ws._socket.remoteAddress, tab.id));
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

        this.

        verifyToken = (token)=>{
            try{
                jwt.verify(token, fs.readFileSync('./auth/secure/secret.pem'));
                return true;
            }
            catch(err){
                return false;
            }
        }
    }
}


const app = new APP();
app.startServer();