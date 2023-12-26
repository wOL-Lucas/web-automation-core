import requests

class Interactor:
    def __init__(self) -> None:
        self.URL = 'https://localhost:6901'
        self.__token = requests.post(self.URL+'/api/auth',json={'context':'chrome-web-extension'},verify=False).json()['token']
        self.session = None

    def clickOnButton(self,className:str,index:int=None) -> bool:
        """
            Receives a button class name, searchs for it, and click on it if found.
            If index is provided, it will click on the button with the given index, otherwise it will click on the first one found.
        """
        
        click = requests.post(self.URL+'/api/sessions',json={"id":self.session,"execute":{"function":"clickOnButton","args":[className, index]}},headers={'Authorization': 'Bearer ' + self.__token},verify=False)
        if(click.status_code >= 200 and click.status_code < 300):
            return click.json()['result']
        else:
            raise Exception('Error on clickOnButton',click.text)
                
    def getSessions(self) -> list:
        """
            Returns a list of all the sessions available.
        """
        return requests.get(self.URL+'/api/sessions',headers={'Authorization': 'Bearer ' + self.__token},verify=False).json()
    
    def setSession(self, tabTitle:str):
        """
            Sets the session to the one with the given tab title.
        """
        sessions = self.getSessions()
        for session in sessions:
            if tabTitle in session['id'] and str(session['title']).upper() == tabTitle.upper():
                self.session = session["id"]
                return
            
        raise Exception('Session not found','Could not find a session with the given tab title on the ID.')



interactor = Interactor()
interactor.setSession('Convênio')
x = interactor.clickOnButton('ss-btn ss-btn-primary',0)
print(x)
