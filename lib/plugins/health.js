module.exports = inject
const { clientCommand } = require('../protocolActions')

function inject (bot, options) {
  bot.isAlive = true
  // Spawn is announced on the first healthy update_health after a login or respawn. Every
  // login counts: a proxy server switch through reconfiguration sends a new login, no respawn.
  let awaitingSpawn = false
  bot.on('login', () => {
    awaitingSpawn = true
    clearPlayerLoadedWait()
  })

  bot._client.on('respawn', (packet) => {
    // Since 1.20.5 this is a bitmask: bit 1 preserves entity data; bit 0
    // only preserves attributes. Older packets carry a boolean.
    bot.isAlive = typeof packet.copyMetadata === 'number'
      ? (packet.copyMetadata & 2) !== 0
      : packet.copyMetadata === true
    awaitingSpawn = true
    clearPlayerLoadedWait()
    bot.emit('respawn')
  })

  // 1.21.4+ servers ignore block and item interactions until the client has
  // sent player_loaded (or 60 ticks have passed). Wait for the player's
  // terrain rather than announcing readiness while still loading a world.
  let activeWait = null
  function clearPlayerLoadedWait () {
    if (!activeWait) return
    clearTimeout(activeWait.timer)
    bot.removeListener('chunkColumnLoad', activeWait.onColumn)
    activeWait = null
  }

  function sendPlayerLoaded () {
    clearPlayerLoadedWait()
    const wait = {}
    const send = () => {
      if (activeWait !== wait) return
      clearPlayerLoadedWait()
      if (bot._client.state === 'play') bot._client.write('player_loaded', {})
    }
    wait.onColumn = () => { if (bot.entity?.position && bot.blockAt(bot.entity.position) != null) send() }
    wait.timer = setTimeout(send, 3000)
    activeWait = wait
    bot.on('chunkColumnLoad', wait.onColumn)
    wait.onColumn()
  }
  bot._client.on('end', clearPlayerLoadedWait)
  bot._client.on('state', state => { if (state !== 'play') clearPlayerLoadedWait() })

  function spawn () {
    if (bot.supportFeature('sendsPlayerLoadedPacket')) sendPlayerLoaded()
    bot.emit('spawn')
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
