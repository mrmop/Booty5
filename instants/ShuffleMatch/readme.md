<img src="http://booty5.com/wp-content/uploads/2014/10/booty5_logo_large.jpg" alt="Booty5 HTML5 Game Maker Example Game" />
<h1>Booty5 HTML5 Game Maker Example Game Shuffle Match</h1>

Booty5 is a free <a href="https://github.com/mrmop/Booty5" title="Booty5 HTML5 Game Engine">open source HTML5 game engine</a> written using JavaScript. A full game editor / game maker / Flash style animation editor is also available from the <a href="http://booty5.com/" title="Booty5 HTML5 Game Maker">Booty5 website</a>.

This repo contains all of the code, audio, graphics and other files associated with the <a href="http://m.me/154421025234521?game=shufflematch">Facebook Instants Game Shuffle Match</a>.

To begin:

1. Download and install Booty5 then open the project file ShuffleMatch/client/ShuffleMatch.xml.
2. Create a Facebook Instants Game at https://developers.facebook.com and copy the app ID
3. Click the Project button and change <YOUR APP ID> in the Host settings to the app ID you copied earlier
4. Run the local server ShuffleMatch/test/run_server.bat
5. Click the Test button to run the game in a browser

Note that if you see a black background and a warning about content not being available in your region then zip the files located in ShuffleMatch/test/public and upload the zip to the web hosting section of the Facebook Instant Game dashboard and push it production, this should solve the issue.

Note that all art and audio is copyrighted so you may NOT use it in any of your games. Feel free to use the code for whatever reason you like however.

One final note regarding SSL. Facebook will not allow you run anything over http so even your local server needs to run on https. You will find a batch file located in ShuffleMatch/test/ssl, run this to generate the local certificate and keys for the local server to function.
