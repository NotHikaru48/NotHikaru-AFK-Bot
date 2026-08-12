function randomMs(minMs, maxMs) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}

function setupLeaveRejoin(bot, createBot) {
    // Timers (Exactly like your original file)
    let leaveTimer = null
    let jumpTimer = null
    let jumpOffTimer = null
    let reconnectTimer = null

    // State (Exactly like your original file)
    let stopped = false
    let reconnectAttempts = 0
    let lastLogAt = 0

    function logThrottled(msg, minGapMs = 2000) {
        const now = Date.now()
        if (now - lastLogAt >= minGapMs) {
            lastLogAt = now
            console.log(msg)
        }
    }

    function cleanup() {
        stopped = true
        if (leaveTimer) clearTimeout(leaveTimer)
        if (jumpTimer) clearTimeout(jumpTimer)
        if (jumpOffTimer) clearTimeout(jumpOffTimer)
        if (reconnectTimer) clearTimeout(reconnectTimer)
        leaveTimer = jumpTimer = jumpOffTimer = reconnectTimer = null
    }

    // 👁️ ADJUSTED SPEC-LOOK: Replaced random jumping with gentle spectator looking
    function scheduleNextLook() {
        if (stopped || !bot.entity) return

        const yaw = (Math.random() * 360 - 180) * (Math.PI / 180)
        const pitch = (Math.random() * 30 - 15) * (Math.PI / 180)
        bot.look(yaw, pitch, true)

        const nextLook = randomMs(4000, 8000) // Looks around every 4-8 seconds
        jumpTimer = setTimeout(scheduleNextLook, nextLook)
    }

    function scheduleReconnect(reason = 'end') {
        if (stopped) return

        let delay = randomMs(2000, 10000)
        reconnectAttempts++
        if (reconnectAttempts > 3) {
            delay += 5000
        }
        delay = Math.min(delay, 15000)

        logThrottled(`[AFK] Rejoin scheduled in ${Math.round(delay / 1000)}s (reason: ${reason}, attempt: ${reconnectAttempts})`)

        reconnectTimer = setTimeout(() => {
            if (stopped) return
            try {
                if (typeof createBot === 'function') createBot()
            } catch (e) {
                console.log('[AFK] createBot error:', e?.message || e)
                scheduleReconnect('createBot-error')
            }
        }, delay)
    }

    bot.once('spawn', () => {
        reconnectAttempts = 0
        cleanup()
        stopped = false

        // ⏱️ ADJUSTED TIMER: Kept at exactly 27 minutes to beat the 30-minute Aternos kick
        const stayTime = 27 * 60 * 1000 

        logThrottled(`[AFK] Safe spectator mode active. Cycling in ${Math.round(stayTime / 1000 / 60)} minutes.`)

        scheduleNextLook()

        leaveTimer = setTimeout(() => {
            if (stopped) return
            logThrottled('[AFK] 27-Minute mark reached. Rejoining server to reset idle tracker.')
            cleanup()
            try {
                bot.quit()
            } catch (e) {
                // Already closed
            }
            // Trigger instant rejoin
            scheduleReconnect('scheduled-cycle')
        }, stayTime)
    })

    // 🔧 ADJUSTED SAFETY: Changed to .once() to prevent your duplicate connection glitch
    bot.once('end', () => {
        if (!stopped) scheduleReconnect('end')
        cleanup()
    })

    bot.once('kicked', (reason) => {
        if (!stopped) scheduleReconnect(`kicked: ${reason}`)
        cleanup()
    })

    bot.once('error', (err) => {
        if (!stopped) scheduleReconnect(`error: ${err.message}`)
        cleanup()
    })
}

module.exports = setupLeaveRejoin
