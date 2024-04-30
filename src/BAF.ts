import { ScoreBoard } from 'mineflayer'
import { createBot } from 'mineflayer'
import { createFastWindowClicker } from './fastWindowClick'
import { addLoggerToClientWriteFunction, initLogger, log, printMcChatToConsole } from './logger'
import { clickWindow, isCoflChatMessage, removeMinecraftColorCodes, sleep } from './utils'
import { onWebsocketCreateAuction } from './sellHandler'
import { tradePerson } from './tradeHandler'
import { swapProfile } from './swapProfileHandler'
import { flipHandler, registerIngameMessage } from './flipHandler'
import { claimSoldItem, registerIngameMessageHandler } from './ingameMessageHandler'
import { MyBot, TextMessageData } from '../types/autobuy'
import { getConfigProperty, initConfigHelper, updatePersistentConfigProperty } from './configHelper'
import { getSessionId } from './coflSessionManager'
import { sendWebhookInitialized, SendWebhookTotals, DisconnectWebwook, webhookInterval } from './webhookHandler'
import { processInput, setupConsoleInterface } from './consoleHandler'
import { initAFKHandler, tryToTeleportToIsland } from './AFKHandler'
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws')
var prompt = require('prompt-sync')()
initConfigHelper()
initLogger()
const version = '1.5.1-af'
let _websocket: WebSocket
let ingameName = getConfigProperty('INGAME_NAME');

if (!ingameName) {
    ingameName = prompt('Enter your ingame name: ')
    updatePersistentConfigProperty('INGAME_NAME', ingameName)
}

const bot: MyBot = createBot({
    username: ingameName,
    auth: 'microsoft',
    logErrors: true,
    version: '1.17',
    host: 'mc.hypixel.net'
})
bot.setMaxListeners(0)

bot.state = 'gracePeriod'
createFastWindowClicker(bot._client)

if (getConfigProperty('LOG_PACKAGES')) {
    addLoggerToClientWriteFunction(bot._client)
}

bot.once('login', () => {
    connectWebsocket()
    bot._client.on('packet', async function (packet, packetMeta) {
        if (packetMeta.name.includes('disconnect')) {
            let wss = await getCurrentWebsocket()
            wss.send(
                JSON.stringify({
                    type: 'report',
                    data: `"${JSON.stringify(packet)}"`
                })
            )
            printMcChatToConsole('§f[§4BAF§f]: §fYou were disconnected from the server...')
            packet = JSON.parse(JSON.stringify(packet));
            let reason = JSON.parse(packet.reason);
            let text = reason.extra[0].text;
            DisconnectWebwook(text)
            printMcChatToConsole('§f[§4BAF§f]: §f' + text)
        }
    })
})
bot.once('spawn', async () => {
    await bot.waitForChunksToLoad()
    await sleep(2000)
    bot.chat('/play sb')
    bot.on('scoreboardTitleChanged', onScoreboardChanged)
    registerIngameMessageHandler(bot)
    registerIngameMessage(bot)
})

function connectWebsocket(url: string = getConfigProperty('WEBSOCKET_URL')) {
    _websocket = new WebSocket(`${url}?player=${ingameName}&version=${version}&SId=${getSessionId(ingameName)}`)
    _websocket.onopen = function () {
        setupConsoleInterface(bot)
        updatePersistentConfigProperty('WEBSOCKET_URL', url)
    }
    _websocket.onmessage = onWebsocketMessage
    _websocket.onclose = function (e) {
        log('Connection closed. Reconnecting... ', 'warn')
        printMcChatToConsole('§f[§4BAF§f]: §4WS Connection closed. Reconnecting... ')
        setTimeout(function () {
            connectWebsocket()
        }, 1000)
    }
    _websocket.onerror = function (err) {
        log('Connection error: ' + JSON.stringify(err), 'error')
        printMcChatToConsole('§f[§4BAF§f]: §4WS Connection error: ' + JSON.stringify(err))
        _websocket.close()
    }
}

async function onWebsocketMessage(msg) {
    let message = JSON.parse(msg.data)
    let data = JSON.parse(message.data)

    switch (message.type) {
        case 'flip':
            log(message, 'debug')
            flipHandler(bot, data)
            break
        case 'chatMessage':
            for (let da of [...(data as TextMessageData[])]) {
                let isCoflChat = isCoflChatMessage(da.text)
                if (da.text.startsWith("Your") && da.text.includes("connection id is")) {
                    let textmsg = da.text.replace(',', '').split(' ');
                    let ID = textmsg[4]
                    sendWebhookInitialized(ID)
                }
                if (!isCoflChat) {
                    log(message, 'debug')
                }
                if (getConfigProperty('USE_COFL_CHAT') || !isCoflChat) {
                    printMcChatToConsole(da.text)
                }
            }
            break
        case 'writeToChat':
            let isCoflChat = isCoflChatMessage(data.text)
            if (!isCoflChat) {
                log(message, 'debug')
            }
            if (getConfigProperty('USE_COFL_CHAT') || !isCoflChat) {
                printMcChatToConsole((data as TextMessageData).text)
            }
            break
        case 'swapProfile':
            log(message, 'debug')
            swapProfile(bot, data)
            break
        case 'createAuction':
            log(message, 'debug')
            onWebsocketCreateAuction(bot, data)
            break
        case 'trade':
            log(message, 'debug')
            tradePerson(bot, data)
            break
        case 'tradeResponse':
            let tradeDisplay = (bot.currentWindow.slots[39].nbt.value as any).display.value.Name.value
            if (tradeDisplay.includes('Deal!') || tradeDisplay.includes('Warning!')) {
                await sleep(3400)
            }
            clickWindow(bot, 39)
            break
        case 'getInventory':
            log('Uploading inventory...')
            let wss = await getCurrentWebsocket()
            wss.send(
                JSON.stringify({
                    type: 'uploadInventory',
                    data: JSON.stringify(bot.inventory)
                })
            )
            break
        case 'execute':
            log(message, 'debug')
            processInput(bot, data)
            break
        case 'privacySettings':
            log(message, 'debug')
            data.chatRegex = new RegExp(data.chatRegex)
            bot.privacySettings = data
            break
    }
}

async function onScoreboardChanged() {
    if (
        bot.scoreboard.sidebar.items.map(item => item.displayName.getText(null).replace(item.name, '')).find(e => e.includes('Purse:') || e.includes('Piggy:'))
    ) {
        bot.removeListener('scoreboardTitleChanged', onScoreboardChanged)
        log('Joined SkyBlock')
        initAFKHandler(bot)
        setTimeout(async () => {
            let wss = await getCurrentWebsocket()
            log('Waited for grace period to end. Flips can now be bought.')
            bot.state = null
            bot.removeAllListeners('scoreboardTitleChanged')

            wss.send(
                JSON.stringify({
                    type: 'uploadScoreboard',
                    data: JSON.stringify(bot.scoreboard.sidebar.items.map(item => item.displayName.getText(null).replace(item.name, '')))
                })
            )
        }, 5500)
        await sleep(2500)
        tryToTeleportToIsland(bot, 0)

        await sleep(20000)
        // trying to claim sold items if sold while user was offline
        claimSoldItem(bot)
    }
}

let executed = true;
async function sendWebhookTotalsMSG(buyTotal: number, soldTotal: number) {
    if (executed) {
        const filePath = path.join(__dirname, 'totals.txt');

        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, 'buy_total=0\nsold_total=0');
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n');

        for (const line of lines) {
            const [key, value] = line.split('=');
            if (key === 'buy_total') {
                buyTotal = parseInt(value, 10);
            } else if (key === 'sold_total') {
                soldTotal = parseInt(value, 10);
            }
        }
        
        await SendWebhookTotals(buyTotal, soldTotal);

        const fileContent2 = `buy_total=0\nsold_total=0`;
        fs.writeFileSync(filePath, fileContent2);
        executed = false;
    }
}

sendWebhookTotalsMSG(0, 0);

const startSession = (Date.now() / 1000).toFixed(0)

function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num;
}


async function updateSession(buyTotal: number, soldTotal: number, flipsBedTotal: number, noBedsTotal: number) {
    const filePath = path.join(__dirname, 'totals.txt');


    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, 'buy_total=0\nsold_total=0\nflips_bed=0\nno_beds=0');
    }


    setInterval(async () => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n');
        
        
        let test = bot.scoreboard.sidebar.items.map(item => item.displayName.getText(null).replace(item.name, '')).find(e => e.includes('Purse:') || e.includes('Piggy:'));
        let purse = test.replace('Purse: ', '').replace(/,/g, '');
        purse = formatNumber(Number(purse));

        
        for (const line of lines) {
            const [key, value] = line.split('=');
            switch (key) {
                case 'buy_total':
                    buyTotal = parseInt(value, 10);
                    break;
                case 'sold_total':
                    soldTotal = parseInt(value, 10);
                    break;
                case 'flips_bed':
                    flipsBedTotal = parseInt(value, 10);
                    break;
                case 'no_beds':
                    noBedsTotal = parseInt(value, 10);
                    break;
            }
        }

        
        await webhookInterval(buyTotal, soldTotal, flipsBedTotal, noBedsTotal, startSession, purse);
    }, 30 * 60 * 1000); 
}

updateSession(0, 0, 0, 0);

export function changeWebsocketURL(newURL: string) {
    _websocket.onclose = () => {}
    _websocket.close()
    if (_websocket.readyState === WebSocket.CONNECTING || _websocket.readyState === WebSocket.CLOSING) {
        setTimeout(() => {
            changeWebsocketURL(newURL)
        }, 500)
        return
    }
    connectWebsocket(newURL)
}

export async function getCurrentWebsocket(): Promise<WebSocket> {
    if (_websocket.readyState === WebSocket.OPEN) {
        return _websocket
    }
    return new Promise(async resolve => {
        await sleep(1000)
        let socket = await getCurrentWebsocket()
        resolve(socket)
    })
}

