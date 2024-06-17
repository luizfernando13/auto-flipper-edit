import axios from 'axios'
import { getConfigProperty } from './configHelper'

function sendWebhookData(options: Partial<Webhook>): void {
    let data = {
        content: options.content || '',
        avatar_url: options.avatar_url,
        tts: options.tts,
        embeds: options.embeds || [],
        username: options.username || 'BAF'
    }
    axios.post(getConfigProperty('WEBHOOK_URL'), data)
}

function isWebhookConfigured() {
    return !!getConfigProperty('WEBHOOK_URL')
}

export function sendWebhookInitialized(ID: string) {
    if (!isWebhookConfigured()) {
        return
    }
    let ingameName = getConfigProperty('INGAME_NAME')
    sendWebhookData({
        content: 'Initialized Connection',
        embeds: [
            {
                title: 'Initialized Connection',
                color: 7714666,
                fields: [
                    { name: 'Connected as:', value: `\`\`\`${ingameName}\`\`\``, inline: false },
                    {
                        name: 'Started at:',
                        value: `<t:${(Date.now() / 1000).toFixed(0)}:t>`,
                        inline: false
                    },
                    { name: 'Your Connection ID:', value: `\`\`\`${ID}\`\`\`` , inline: false},
                ],
                thumbnail: { url: `https://minotar.net/helm/${ingameName}/600.png` },
                footer: {
                    "text": "Edit Made by luizfernando13",
                    "icon_url": "https://cdn.discordapp.com/avatars/591035486693359641/a363e32ab636d378d46de06a1e6d6616.png?size=2048"
                  }
            }
        ]
    })
}

export function sendWebhookItemPurchased(itemName: string, price: string, profit: string) {
    if (!isWebhookConfigured()) {
        return
    }
    let ingameName = getConfigProperty('INGAME_NAME')
    sendWebhookData({
        embeds: [
            {
                title: 'Item Purchased',
                color: 570644,
                fields: [
                    {
                        name: 'Item:',
                        value: `\`\`\`${itemName}\`\`\``,
                        inline: true
                    },
                    {
                        name: 'Bought for:',
                        value: `\`\`\`${price}\`\`\``,
                        inline: true
                    },
                    {
                        name: 'Estimated Profit:',
                        value: `\`\`\`${profit}\`\`\``,
                        inline: false,
                    },
                    { name:' ', value:`<t:${(Date.now() / 1000).toFixed(0)}:R>`, inline: false}
                ],
                thumbnail: { url: `https://minotar.net/helm/${ingameName}/600.png` },
            }
        ]
    })
}

export function sendWebhookItemPurchased100M(itemName: string, price: string, profit: string) {
    if (!isWebhookConfigured()) {
        return
    }
    let ingameName = getConfigProperty('INGAME_NAME')
    sendWebhookData({
        embeds: [
            {
                title: 'Legendary Flip!',
                color: 15509525,
                fields: [
                    {
                        name: 'Item:',
                        value: `\`\`\`${itemName}\`\`\``,
                        inline: true
                    },
                    {
                        name: 'Bought for:',
                        value: `\`\`\`${price}\`\`\``,
                        inline: true
                    },
                    {
                        name: 'Estimated Profit:',
                        value: `\`\`\`${profit}\`\`\``,
                        inline: false,
                    },
                    { name:' ', value:`<t:${(Date.now() / 1000).toFixed(0)}:R>`, inline: false}
                ],
                thumbnail: { url: `https://minotar.net/helm/${ingameName}/600.png` },
                footer: {
                    "text": "Edit Made by luizfernando13",
                    "icon_url": "https://cdn.discordapp.com/avatars/591035486693359641/a363e32ab636d378d46de06a1e6d6616.png?size=2048"
                  }
            }
        ]
    })
}

export function sendWebhookItemSold(itemName: string, price: string, purchasedBy: string) {
    if (!isWebhookConfigured()) {
        return
    }
    let ingameName = getConfigProperty('INGAME_NAME')
    sendWebhookData({
        embeds: [
            {
                title: 'Item Sold',
                color: 14881033,
                fields: [
                    {
                        name: 'Purchased by:',
                        value: `\`\`\`${purchasedBy}\`\`\``,
                        inline: true
                    },
                    {
                        name: 'Item Sold:',
                        value: `\`\`\`${itemName}\`\`\``,
                        inline: true
                    },
                    {
                        name: 'Sold for:',
                        value: `\`\`\`${price}\`\`\`\n\n`,
                        inline: true
                    },
                    { name:' ', value:`<t:${(Date.now() / 1000).toFixed(0)}:R>`, inline: false}
                ],
                thumbnail: { url: `https://minotar.net/helm/${ingameName}/600.png` },
            }
        ]
    })
}

export function sendWebhookItemListed(itemName: string, price: string, duration: number) {
    if (!isWebhookConfigured()) {
        return
    }
    let ingameName = getConfigProperty('INGAME_NAME')
    sendWebhookData({
        embeds: [
            {
                title: 'Item Listed',
                color: 15335168,
                fields: [
                    {
                        name: 'Listed Item:',
                        value: `\`\`\`${itemName}\`\`\``,
                        inline: false
                    },
                    {
                        name: 'Item Price:',
                        value: `\`\`\`${price}\`\`\``,
                        inline: false
                    },
                    {
                        name: 'AH Duration:',
                        value: `\`\`\`${duration}h\`\`\`\n\n`,
                        inline: false
                    },
                    { name:' ', value:`<t:${(Date.now() / 1000).toFixed(0)}:R>`, inline: false}
                ],
                thumbnail: { url: `https://minotar.net/helm/${ingameName}/600.png` },
            }
        ]
    })
}


export function SendWebhookTotals(buyTotal: number, soldTotal: number): void {
    if (!isWebhookConfigured()) {
      return;
    }
    let ingameName = getConfigProperty('INGAME_NAME');
  
    sendWebhookData({
      embeds: [
        {
          title: '**Last Session Statistics:**',
          description: 'Items purchased and sold by the bot during the last session.',
          color: 2410969,
          fields: [
            { name: 'Items purchased:', value: `\`\`\`${buyTotal}\`\`\`` , inline: true},
            { name: 'Items sold:', value: `\`\`\`${soldTotal}\`\`\``, inline: true},
          ],
          thumbnail: { url: `https://minotar.net/helm/${ingameName}/600.png` },
          footer: {
            "text": "Edit Made by luizfernando13",
            "icon_url": "https://cdn.discordapp.com/avatars/591035486693359641/a363e32ab636d378d46de06a1e6d6616.png?size=2048"
          }
        },
      ],
    });
  }


  export function DisconnectWebwook(DisconnectReason: string) {
    if (!isWebhookConfigured()) {
        return
    }
    let ingameName = getConfigProperty('INGAME_NAME')
    sendWebhookData({
        embeds: [
            {
                title: 'Disconnected from the server',
                color: 14881033,
                fields: [
                    { name: 'You got disconnected in the account:', value: `\`\`\`${ingameName}\`\`\``, inline: false },
                    {
                        name: 'Disconnected at:',
                        value: `<t:${(Date.now() / 1000).toFixed(0)}:t>`,
                        inline: false
                    },
                    { name: 'Reason:', value: `\`\`\`${DisconnectReason}\`\`\`` , inline: false},
                ],
                thumbnail: { url: `https://minotar.net/helm/${ingameName}/600.png` },
                footer: {
                    "text": "Edit Made by luizfernando13",
                    "icon_url": "https://cdn.discordapp.com/avatars/591035486693359641/a363e32ab636d378d46de06a1e6d6616.png?size=2048"
                  }
            }
        ]
    })
}

export function webhookInterval(buyTotal: number, soldTotal: number, flipsBedTotal: number, noBedsTotal: number, startedSession: string, purse: string): void {
    if (!isWebhookConfigured()) {
      return;
    }
    let ingameName = getConfigProperty('INGAME_NAME');
  
    sendWebhookData({
      embeds: [
        {
          title: 'Current flipping session',
          description: 'Session Stats update every 30 minutes.',
          color: 2410969,
          fields: [
            { name: 'Items purchased:', value: `\`\`\`${buyTotal}\`\`\`` , inline: false},
            { name: 'Items sold:', value: `\`\`\`${soldTotal}\`\`\``, inline: false},
            { name: 'Winned Flips that are beds:', value: `\`\`\`${flipsBedTotal}\`\`\``, inline: false},
            { name: 'Winned Flips that not are beds:', value: `\`\`\`${noBedsTotal}\`\`\``, inline: false},
            { name: 'Purse:', value: `\`\`\`${purse}\`\`\``, inline: false},
            { name: 'Session Started at:', value: `<t:${startedSession}:f> // <t:${startedSession}:R>`, inline: false},
          ],
          thumbnail: { url: `https://minotar.net/helm/${ingameName}/600.png` },
          footer: {
            "text": "Edit Made by luizfernando13",
            "icon_url": "https://cdn.discordapp.com/avatars/591035486693359641/a363e32ab636d378d46de06a1e6d6616.png?size=2048"
          }
        },
      ],
    });
  }