module.exports = inject
const { clientCommand } = require('../protocolActions')

// Vanilla treats a client that never reports player_loaded as loaded after 60 ticks.
const PLAYER_LOADED_FALLBACK_MS = 3000

function inject (bot, options) {
  bot.isAlive = true
  // Spawn is announced on the first healthy update_health after a login or respawn. Every
  // login counts: a proxy server switch through reconfiguration sends a new login, no respawn.
  let awaitingSpawn = false
  bot.on('login', () => {
    awaitingSpawn = true
    cancelPendingSpawn()
  })

  bot._client.on('respawn', (packet) => {
    // Since 1.20.5 this is a bitmask: bit 1 preserves entity data; bit 0
    // only preserves attributes. Older packets carry a boolean.
    bot.isAlive = typeof packet.copyMetadata === 'number'
      ? (packet.copyMetadata & 2) !== 0
      : packet.copyMetadata === true
    awaitingSpawn = true
    cancelPendingSpawn()
    bot.emit('respawn')
  })

  // Spawn tells listeners they can interact, so it is announced only once the server accepts
  // interactions. 1.9+ servers refuse block interactions until the client has confirmed their latest
  // teleport, which the physics plugin answers on the next tick. 1.21.4+ servers also ignore block,
  // item and entity interactions until the client has sent player_loaded (or 60 ticks have passed),
  // which vanilla sends once the player's terrain has loaded. A teleport confirmed while spawn
  // waits can move the player into terrain that has not loaded yet, so both conditions are checked
  // together at the player's current position until the fallback deadline set when the wait began.
  // A new login or respawn, or leaving play, cancels a pending spawn.
  const sendsPlayerLoaded = bot.supportFeature('sendsPlayerLoadedPacket')
  let pendingSpawn = null
  function stopWaitingForTerrain (wait) {
    clearTimeout(wait.timer)
    if (wait.onColumn) bot.removeListener('chunkColumnLoad', wait.onColumn)
  }
  function cancelPendingSpawn () {
    if (!pendingSpawn) return
    stopWaitingForTerrain(pendingSpawn)
    pendingSpawn = null
  }

  function terrainLoaded () {
    const position = bot.entity?.position
    if (!position) return false
    // Vanilla's LevelLoadTracker does not wait for terrain outside the build height or for spectators.
    if (bot.game && (position.y < bot.game.minY || position.y >= bot.game.minY + bot.game.height)) return true
    if (bot.game?.gameMode === 'spectator') return true
    return bot.blockAt(position) != null
  }

  function spawn () {
    cancelPendingSpawn()
    const wait = { terrainWaitOver: !sendsPlayerLoaded, confirming: false }
    pendingSpawn = wait
    const terrainReady = () => wait.terrainWaitOver || terrainLoaded()
    const announce = () => {
      stopWaitingForTerrain(wait)
      pendingSpawn = null
      if (sendsPlayerLoaded) bot._client.write('player_loaded', {})
      // A death while loading is reported by its own event; the next respawn announces spawn.
      if (bot.isAlive) bot.emit('spawn')
    }
    const tryAnnounce = () => {
      if (pendingSpawn !== wait || wait.confirming || !terrainReady()) return
      const afterTeleportsConfirmed = bot._afterTeleportsConfirmed ?? (action => action())
      wait.confirming = true
      afterTeleportsConfirmed(() => {
        wait.confirming = false
        // Otherwise the next chunk or the fallback tries again.
        if (pendingSpawn === wait && terrainReady()) announce()
      })
    }
    if (sendsPlayerLoaded) {
      wait.onColumn = tryAnnounce
      wait.timer = setTimeout(() => {
        wait.terrainWaitOver = true
        tryAnnounce()
      }, PLAYER_LOADED_FALLBACK_MS)
      bot.on('chunkColumnLoad', wait.onColumn)
    }
    tryAnnounce()
  }
  bot._client.on('end', cancelPendingSpawn)
  bot._client.on('state', state => { if (state !== 'play') cancelPendingSpawn() })

  bot._client.on('update_health', (packet) => {
    bot.health = packet.health
    bot.food = packet.food
    bot.foodSaturation = packet.foodSaturation
    bot.emit('health')
    if (bot.health <= 0) {
      if (bot.isAlive) {
        bot.isAlive = false
        bot.emit('death')
      }
      if (!options.respawn) return
      bot.respawn()
    } else if (bot.health > 0 && (!bot.isAlive || awaitingSpawn)) {
      bot.isAlive = true
      awaitingSpawn = false
      spawn()
    }
  })

  const respawn = () => {
    if (bot.isAlive) return
    bot._client.write('client_command', clientCommand(bot, 'perform_respawn'))
  }

  bot.respawn = respawn
}
