function randomMs(minMs, maxMs) { 
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs 
} 

function setupLeaveRejoin(bot, createBot) { 
  // Timers disabled
  let leaveTimer = null 
  let jumpTimer = null 
  let jumpOffTimer = null 
  let reconnectTimer = null 

  // State
  let stopped = true // Set to true to block schedule loops
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

  // Disabled: Will not look around
  function scheduleNextLook() { 
    return 
  } 

  // Disabled: Will not attempt to reconnect
  function scheduleReconnect(reason = 'end') { 
    return 
  } 

  bot.once('spawn', () => { 
    reconnectAttempts = 0 
    cleanup() 
    stopped = true // Keeps loop logic turned off
    logThrottled(`[AFK] Leave/Rejoin functions have been completely disabled.`) 
  }) 

  // Safety triggers cleared out
  bot.once('end', () => { 
    cleanup() 
  }) 

  bot.once('kicked', (reason) => { 
    cleanup() 
  }) 

  bot.once('error', (err) => { 
    cleanup() 
  }) 
} 

module.exports = setupLeaveRejoin
