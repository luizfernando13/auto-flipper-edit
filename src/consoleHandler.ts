import readline from 'readline'
import { getConfigProperty } from './configHelper'
import { sleep, clickWindow } from './utils'
import { MyBot } from '../types/autobuy'
import { changeWebsocketURL, getCurrentWebsocket } from './BAF'
import { claimPurchased } from './ingameMessageHandler'
import { printMcChatToConsole } from './logger';

export async function processInput(bot: MyBot, input: string) {
    let ws = await getCurrentWebsocket()
    let lowercaseInput = input.toLowerCase()
    if ((lowercaseInput?.startsWith('/visit')) && input?.split(' ').length >= 2) {
        let window = bot.currentWindow;

        bot.state = 'purchasing'
        if (window) {
            bot.closeWindow(window)
        }
        await sleep(1000)
        bot.chat(input)
        await sleep(1000)
        let window2 = bot.currentWindow;
        let items = window2.containerItems();
        items = items.filter(item => item.name !== 'black_stained_glass_pane');
        clickWindow(bot, 11)
        clickWindow(bot, 13)
        await sleep(2000)
        bot.removeAllListeners('windowOpen')
        bot.state = null
        bot.closeWindow(window2)
        return
    }
    else if ((lowercaseInput?.startsWith('/cofl') || input?.startsWith('/baf')) && input?.split(' ').length >= 2) {
        let splits = input.split(' ')
        splits.shift() // remove /cofl
        let command = splits.shift().toLowerCase()

        if (command === 'connect') {
            console.log(splits[0])
            changeWebsocketURL(splits[0])
            return
        }
        if (command === 'forceclaim') {
            printMcChatToConsole(`§f[§4BAF§f]: §fForce claiming...`)
            let canStillClaim = true
            while (canStillClaim) {
                try {
                    canStillClaim = await claimPurchased(bot, false)
                    await sleep(1000)
                } catch (e) {
                    canStillClaim = false
                    printMcChatToConsole(`§f[§4BAF§f]: §fRan into error while claiming. Please check your logs or report this to the developer.`)
                }
            }
            printMcChatToConsole(`§f[§4BAF§f]: §fFinished claiming.`)
            return
        }

        ws.send(
            JSON.stringify({
                type: command,
                data: `"${splits.join(' ')}"`
            })
        )
    }
    else {
        ws.send(
            JSON.stringify({
                type: 'chat',
                data: `"${input}"`
            })
        )
    }
}

let consoleSetupFinished = false

export function setupConsoleInterface(bot: MyBot) {
    if (!getConfigProperty('ENABLE_CONSOLE_INPUT') || consoleSetupFinished) {
        return
    }
    consoleSetupFinished = true

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    rl.on('line', async input => {
        if (input?.startsWith('/') && !/^\/(cofl|baf|visit)/.test(input)) {
            bot.chat(input);
        }        
        else {
            processInput(bot, input);
        }
    })
}