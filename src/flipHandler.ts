import { Flip, MyBot } from '../types/autobuy'
import { getConfigProperty } from './configHelper'
import { getFastWindowClicker } from './fastWindowClick'
import { log, printMcChatToConsole } from './logger'
import { clickWindow, getWindowTitle, numberWithThousandsSeparators, sleep } from './utils'
import { ChatMessage } from 'prismarine-chat'
import { sendWebhookItemPurchased, sendWebhookItemPurchased100M } from './webhookHandler'
import { claimPurchased } from './ingameMessageHandler'


let notcoins = false;
let globalText = "";
let buy_total = 0

export function registerIngameMessage(bot: MyBot) {
    bot.on('message', (message: ChatMessage, type) => {
        let text = message.getText(null)
        if (type == 'chat') {
            
            if (text.startsWith("You") && text.includes("don't have") && text.includes('afford this bid')) {
                notcoins = true;
            }
            if (text.startsWith('You') && text.includes('purchased') && text.includes('for')) {
                globalText = text;
            }
        }
    })
}

export async function flipHandler(bot: MyBot, flip: Flip) {
    flip.purchaseAt = new Date(flip.purchaseAt)

    if (bot.state) {
        setTimeout(() => {
            flipHandler(bot, flip)
        }, 1100)
        return
    }
    bot.state = 'purchasing'
    let timeout = setTimeout(() => {
        if (bot.state === 'purchasing') {
            log("Resetting 'bot.state === purchasing' lock")
            bot.state = null
            bot.removeAllListeners('windowOpen')
        }
    }, 10000)
    let isBed = flip.purchaseAt.getTime() > new Date().getTime()
    let delayUntilBuyStart = isBed ? flip.purchaseAt.getTime() - new Date().getTime()-getConfigProperty('DELAY_TO_REMOVE_BED') : getConfigProperty('FLIP_ACTION_DELAY')

    bot.lastViewAuctionCommandForPurchase = `/viewauction ${flip.id}`
    await sleep(delayUntilBuyStart)
    bot.chat(bot.lastViewAuctionCommandForPurchase)

    printMcChatToConsole(
        `§f[§4BAF§f]: §fTrying to purchase flip${isBed ? ' (Bed)' : ''}: ${flip.itemName} §ffor ${numberWithThousandsSeparators(
            flip.startingBid
        )} coins (Target: ${numberWithThousandsSeparators(flip.target)}) §e(Profit: +${numberWithThousandsSeparators(flip.target - flip.startingBid * 0.965).split(".")[0]})`
    )

    if (getConfigProperty('USE_WINDOW_SKIPS')) {
        useWindowSkipPurchase(flip, isBed)

        // clear timeout after 1sec, so there are no weird overlaps that mess up the windowIds
        setTimeout(() => {
            bot.state = null
            clearTimeout(timeout)
        }, 2500)
    } else {
        await useRegularPurchase(bot, isBed, flip);
        await sleep(2000)
        if (globalText.startsWith('You purchased')) {
            claimPurchased(bot)
            let value = flip.target - flip.startingBid;
            let valueMinus3_5Percent = value * 0.965;
            let result = numberWithThousandsSeparators(valueMinus3_5Percent);
            let parts = result.split(".");
            let formattedValue = parts[0];
            let numericValue = Number(formattedValue.replace(/,/g, ''));
            
            if (numericValue < 100000000){
                sendWebhookItemPurchased(globalText.split(' purchased ')[1].split(' for ')[0], 
                globalText.split(' for ')[1].split(' coins!')[0], `${"+" + formattedValue}`)
            }
            if (numericValue >= 100000000) {
                sendWebhookItemPurchased100M(globalText.split(' purchased ')[1].split(' for ')[0], 
                globalText.split(' for ')[1].split(' coins!')[0], `${"+" + formattedValue}`)
            }
            globalText = '';
        }
    }
}

async function useRegularPurchase(bot: MyBot, isBed: boolean, flip: Flip) {
    bot.addListener('windowOpen', async window => {
        let title = getWindowTitle(window)
        let window1 = bot.currentWindow;
        let total_clicks = 0;
        if (isBed && title.toString().includes('BIN Auction View')) {
            let items = window1.containerItems();
          
            // Filtrar o item 'black_stained_glass_pane'
            items = items.filter(item => item.name !== 'black_stained_glass_pane');
          
            let bedItem = items.find(item => item.name === 'red_bed');
            let potatoItem = items.find(item => item.name === 'potato');
          
            if (potatoItem) {
              console.log('Item "potato" encontrado. Parando o loop...');
              return;
            }
          
            while (bedItem && !title.toString().includes('Confirm Purchase') && !potatoItem) {
              await sleep(getConfigProperty('DELAY_BETWEEN_CLICKS'));
              clickWindow(bot, 31);
              total_clicks++;

              // Atualizar a janela e a lista de itens
              window1 = bot.currentWindow;
              title = getWindowTitle(window1);
              items = window1.containerItems().filter(item => item.name !== 'black_stained_glass_pane');
              potatoItem = items.find(item => item.name === 'potato');
          
              if (potatoItem) {
                console.log('Item "potato" found. Stopping the loop.');
                break;
              }
              if (notcoins || total_clicks > 300) {
                let title = getWindowTitle(window1)
                if (title.toString().includes('BIN Auction View')) {
                    
                    printMcChatToConsole("§f[§4BAF§f]: §cClosing this flip because you don't have enough coins to purchase!")
                    bot.removeAllListeners('windowOpen')
                    bot.state = null
                    bot.closeWindow(window)
                    notcoins = false
                    return
                }
              }
            }
            clickWindow(bot, 31);
            printMcChatToConsole(`§f[§4BAF§f]: §l§6Clicked ${total_clicks} times on the bed.`);
            total_clicks = 0;
            clickWindow(bot, 31)
          }
        if (title.toString().includes('BIN Auction View')) {
            clickWindow(bot, 31)
        }
        if (isBed && title.toString().includes('Confirm Purchase')) {
            clickWindow(bot, 11)
            bot.removeAllListeners('windowOpen')
            bot.state = null
            return
        }
        if (title.toString().includes('Confirm Purchase')) {
            clickWindow(bot, 11)
            bot.removeAllListeners('windowOpen')
            bot.state = null
            return
        }
    })
}

async function useWindowSkipPurchase(flip: Flip, isBed: boolean) {
    let lastWindowId = getFastWindowClicker().getLastWindowId()

    if (isBed) {
        getFastWindowClicker().clickBedPurchase(flip.startingBid, lastWindowId + 1)
    } else {
        getFastWindowClicker().clickPurchase(flip.startingBid, lastWindowId + 1)
    }
    await sleep(getConfigProperty('FLIP_ACTION_DELAY'))
    getFastWindowClicker().clickConfirm(flip.startingBid, flip.itemName, lastWindowId + 2)
}
