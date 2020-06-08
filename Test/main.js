//jshint esversion:6

const { app, BrowserWindow, net, globalShortcut} = require("electron");
const ejse = require('ejs-electron');
const ABCD = require('request');

//In Game check
let gameStatus = false;
//EndPoint PUBGm API
const endpoint = 'http://localhost:10086/';
//Data refresh time in ms
const refreshTime = 1000;
//Refresh status of window (player and damage)
let damageRefresh = 0;
let playerRefresh = 0;
let logoRefresh = 0;
//Window status 0 = not active, 1 = active
let damageWindow = 0;
let playerWindow = 0;
let logoWindow = 0;
//Window hide status
let damageWindowHidden = false;
let playerWindowHidden = false;
let logoWindowHidden = false;
//Old data for change capture
let oldCharacterID = 0;
let oldDamage = 0;
let oldTeamId = 0;


function createDamageWindow() {
    const win = new BrowserWindow({
        x:1043,
        y: 900,
        width: 129,
        height: 400,
        frame: false,
        transparent: true,
        hasShadow: false,
        offscreen: true,
        focusable: false,
    });
    win.setAlwaysOnTop(true, "status", 1);
    win.loadURL(`file://${__dirname}/damage.ejs`);
    win.setIgnoreMouseEvents(true);
    function refresh() {
		if (gameStatus === false) {
		win.hide();
		damageWindowHidden = true;
	    } else {
            if (damageWindowHidden == true) {
                win.show();
                damageWindowHidden = false;
            }
            if (damageRefresh === 1) {
                win.reload();
            }
	    }
        
    }
    refresh();
    setInterval(refresh,refreshTime);
	globalShortcut.register('CommandOrControl+E', () => {
    win.hide();
	  });
	globalShortcut.register('CommandOrControl+D', () => {
	win.show();
	  });
}

function createLogoWindow() {
    const win = new BrowserWindow({
        x:1043,
        y: 900,
        width: 129,
        height: 400,
        frame: false,
        transparent: true,
        hasShadow: false,
        offscreen: true,
        focusable: false,
    });
    win.setAlwaysOnTop(true, "status", 1);
    win.loadURL(`file://${__dirname}/logo.ejs`);
    win.setIgnoreMouseEvents(true);
    function refresh() {
		if (gameStatus === false) {
		win.hide();
		damageWindowHidden = true;
	    } else {
            if (damageWindowHidden == true) {
                win.show();
                damageWindowHidden = false;
            }
            if (damageRefresh === 1) {
                win.reload();
            }
	    }
        
    }
    refresh();
    setInterval(refresh,refreshTime);
	globalShortcut.register('CommandOrControl+E', () => {
    win.hide();
	  });
	globalShortcut.register('CommandOrControl+D', () => {
	win.show();
	  });
}

function createPlayerWindow() {
    const win = new BrowserWindow({
        x:1180,
        y: 897,
        width: 132,
        height: 180,
        frame: false,
        transparent: true,
        hasShadow: false,
        offscreen: true,
        focusable: false,
    });
    win.setAlwaysOnTop(true, "status", 1);
    win.loadURL(`file://${__dirname}/player.ejs`);
    win.setIgnoreMouseEvents(true);
    function refresh() {
		if (gameStatus === false) {
		win.hide();
		playerWindowHidden = true;
	} else {
		if (playerWindowHidden == true) {
			win.show();
			playerWindowHidden = false;
		}
		if (playerRefresh === 1) {
            win.reload();
        }
	}
        
    }
    refresh();
    setInterval(refresh,refreshTime);
	globalShortcut.register('CommandOrControl+X', () => {
    win.hide();
	  });
	globalShortcut.register('CommandOrControl+S', () => {
	win.show();
	  });
}




function loadJSON() {
	const inGameCheck = net.request(endpoint + 'isingame');
    inGameCheck.on('response', (response) => {
        response.on("data", (data) => {
            const isInGame = JSON.parse(data);
            if (isInGame.isInGame === true) {
				gameStatus = true;
				const request = net.request(endpoint + 'getobservingplayer');
				request.on('response', (response) => {
				response.on('data', (data) => {
				const pubg = JSON.parse(data);
                const characterID = pubg.observingPlayer[0];
                //Player HUD
                if (playerWindow === 0) {
                    createPlayerWindow();
                    playerWindow = 1;
				}
				if (oldCharacterID != characterID) {
					const filePath = __dirname + "/images/"+ characterID +".png";
					ejse.data('name', filePath);
					oldCharacterID = characterID;
                    playerRefresh = 1;
				} else if (oldCharacterID === characterID) {
                    playerRefresh = 0;
				} 
                ABCD(endpoint + 'gettotalplayerlist', function(error, response, body) {
                    const pubgData = JSON.parse(body);
                    const playerInfo = pubgData.playerInfoList;
                    playerInfo.forEach(player => {
                        if (player.uId == characterID) {
                            //Logo HUD
                            if (logoWindow === 0) {
                                createLogoWindow();
                            }
                            if (oldTeamId != player.teamId) {
                                
                            }
                            //Damage HUD
							if (damageWindow === 0) {
								createDamageWindow();
								damageWindow = 1;
							}
							if (oldDamage != player.damage) {
								oldDamage = player.damage;
								ejse.data('playerDamage', player.damage);
								damageRefresh = 1;
							} else {
								damageRefresh = 0;
							}
                        }
                    });
                });
				ejse.data('playerDamage', oldDamage);
				});
			});
			request.end();
            } else {
                gameStatus = false;
            }
        });
    });
    inGameCheck.end();
}


app.whenReady().then(() => {
    loadJSON();
    setInterval(loadJSON, refreshTime);
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createDamageWindow();
            createPlayerWindow();
          }

    });

});