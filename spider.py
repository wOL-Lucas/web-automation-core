import asyncio
import websockets
import ssl
import json
import threading
import time

class webcore():
    def __init__(self) -> None:
        self.ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        self.ssl_context.load_cert_chain('auth/cert.pem', 'auth/key.pem')
        self.sessions = []
        self.activeSession = None

    async def echo(self,websocket, path):
        async for message in websocket:
            try:
                message = json.loads(message)
                match(message['type']):
                    case 'register':
                        print('register: ', message)
                        self.registerSocket(websocket,message)

                    case 'close':
                        print('close: ', message)
                        self.closeSession(websocket)
                        print('Sockets: ', len(self.sessions))

                    case _:
                        print('message: ', message)

            except Exception as e:
                raise Exception('Error on message',message, e)
                


    def setActiveSession(self, title:str) -> None:
        for session in self.sessions:
            if(session['title'] == title and session['visibility'] == 'visible'):
                self.activeSession = session
                return

        else:
            raise Exception('Session not found')
        

    async def execute(self, command, args:list=[]):
        print('\n\nEXECUTING\n\n')

        if(self.activeSession):
            message = {
                'type':'execute',
                'execute':{
                    'function':command,   
                    'args':args
                }
            }
            await self.activeSession['socket'].send(json.dumps(message))

            # Wait for a response before continuing
            response = await self.activeSession['socket'].recv()
            return json.loads(response)

        else:
            raise Exception('No active session')

    def closeSession(self, websocket):
        for session in self.sessions:
            if(session['socket'] == websocket):
                self.sessions.remove(session)
                return

        else:
            raise Exception('Session not found')

    def clickOnButton(self, buttonClassName:str) -> dict:
        return self.execute('clickOnButton',[buttonClassName])

    def getElementPosition(self, elementClassName:str) -> dict:
        info = self.execute('getElementPosition',[elementClassName])
        print('info: ', info)

        return info
    
    
    def registerSocket(self,websocket, data:dict):
        ID = f'{data["title"]}{data["timestamp"]}'
        self.sessions.append({
            'id':ID,
            'socket':websocket,
            'title':data["title"],
            'visibility':data["pageAttributes"]["visibility"],
            'height':data["pageAttributes"]["height"],
            'width':data["pageAttributes"]["width"],
            'url':data["url"],
            'timestamp':data["timestamp"]
        })
        print('Socket registered: ', websocket)
        print('Sockets: ', len(self.sessions))



    def startServer(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        start_server = websockets.serve(self.echo, "localhost", 6901,ssl=self.ssl_context)

        loop.run_until_complete(start_server)
        loop.run_forever()

    def start(self):
        self.serverThread = threading.Thread(target=self.startServer)
        self.serverThread.start()
        print('Server started')
    
    def test_get_pos(self, title:str, elementClassName:str, wait:int=0):
        time.sleep(5)
        print('Test started')
        time.sleep(wait)

        self.setActiveSession(title)
        return self.getElementPosition(elementClassName)

ws = webcore()
ws.start()

x = asyncio.run(ws.test_get_pos('Painel Gerencial','abas',25))

print('\nx: ', x)
