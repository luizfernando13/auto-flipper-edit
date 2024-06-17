interface SESSIONS {
    [key: string]: ColfSession
}

interface Config {
    INGAME_NAME: string
    WEBHOOK_URL: string
    USE_COFL_CHAT: boolean
    ENABLE_CONSOLE_INPUT: boolean
    SESSIONS: SESSIONS
    USE_WINDOW_SKIPS: boolean
    DELAY_BETWEEN_CLICKS: number
    DELAY_TO_REMOVE_BED: number
    WEBSOCKET_URL: string
}

interface ColfSession {
    id: string
    expires: Date
}
