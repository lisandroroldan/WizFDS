<p align="center"><img alt="WizFDS" src="https://wizfds.com/welcome/assets/wizfds.svg"></p>

WizFDS is Graphical User Interface (**GUI**) for Fire Dynamics Simulator (**FDS**).  
The software is open-source project released under GNU v3.0 license founded by F&K Consulting Engineers Ltd.  

GUI is divided into 2 separated tools. All geometrical entities are created in AutoCAD/BricsCAD plugin [(download)](https://github.com/fkce/WizFDS/releases/download/0.3.0/WizFDS_0.3.0.msi). Other boundary conditions are set in web application [(link)](https://wizfds.com/login) which communicate with AutoCAD through websocket protocol.

**WizFDS is still under development and may include bugs.** However, we count on your help and support!

**We also assume that you have basic knowladge of FDS software**. If not start from reading [FDS User Guide](https://github.com/firemodels/fds/releases/download/FDS6.7.0/FDS_User_Guide.pdf).

## To get more information: 
1. Visit our official website: https://wizfds.com/
2. Read wiki pages to find some tutorials: https://github.com/fkce/WizFDS/wiki

# How to start using?
## AutoCAD plugin
1. Install AutoCAD plugin [(download)](https://github.com/fkce/WizFDS/releases/download/0.3.0/WizFDS_0.3.0.msi)
2. Run AutoCAD and type in command line:
```
netload
```
3. Choose wizFDS.dll file (default location: _C:\Program Files\firemodels\WizFDS\WizFDS.dll_)
4. Start drawing FDS entities
[(see video tutorial)](https://github.com/fkce/WizFDS/wiki/How-to-start-using%3F#autocad-plugin)

## Web application
1. Register & Log in to [WizFDS](https://wizfds.com/login)
2. Create new project and scenario
3. Connect with Autocad [(read more about known problems with connecting)](https://github.com/fkce/WizFDS/wiki/Known-problems#insecure-websocket-connection)
4. Set up boundary conditions
5. Edit your file in text/vim editor
6. Download it and run on your / external resources  
[(see video tutorial)](https://github.com/fkce/WizFDS/wiki/How-to-start-using%3F#web-application)

# Authors
WizFDS is founded by F&K Consulting Engineers Ltd - [www.fkce.pl](https://www.fkce.pl)  
All code was developed mainly by Mateusz Fliszkiewicz & Michał Ilnicki.
Special thanks for entire F&K Team for supporting during testing.
