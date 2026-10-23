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

  // 1.21.4+ servers ignore block, item and entity interactions until the client has
  // sent player_loaded (or 60 ticks have passed). Like vanilla, send it once the
  // player's terrain has loaded, and only then announce spawn, so spawn listeners
  // can interact straight away. A new login or respawn, or leaving play, cancels it.
  let pendingSpawn = null
  function cancelPendingSpawn () {
    if (!pendingSpawn) return
    clearTimeout(pendingSpawn.timer)
    bot.removeListener('chunkColumnLoad', pendingSpawn.onColumn)
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

  function spawnWhenLoaded () {
    cancelPendingSpawn()
    const wait = {}
    const ready = () => {
      if (pendingSpawn !== wait) return
      cancelPendingSpawn()
      if (bot._client.state !== 'play') return
      bot._client.write('player_loaded', {})
      // A death while loading is reported by its own event; the next respawn announces spawn.
      if (bot.isAlive) bot.emit('spawn')
    }
    wait.onColumn = () => { if (terrainLoaded()) ready() }
    wait.timer = setTimeout(ready, PLAYER_LOADED_FALLBACK_MS)
    pendingSpawn = wait
    bot.on('chunkColumnLoad', wait.onColumn)
    wait.onColumn()
  }
  bot._client.on('end', cancelPendingSpawn)
  bot._client.on('state', state => { if (state !== 'play') cancelPendingSpawn() })

  function spawn () {
    if (bot.supportFeature('sendsPlayerLoadedPacket')) spawnWhenLoaded()
    else bot.emit('spawn')
  }

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
