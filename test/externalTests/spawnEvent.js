const mineflayer = require('mineflayer')
const { Vec3 } = require('vec3')
const { once, onceWithCleanup } = require('../../lib/promise_utils')

module.exports = () => async (bot) => {
  const join = () => mineflayer.createBot({
    username: 'spawnbot',
    viewDistance: 'tiny',
    port: bot.test.port,
    host: '127.0.0.1',
    version: bot.version
  })
  const leave = async (spawnBot) => {
    const left = once(bot, 'playerLeft')
    spawnBot.end()
    // Wait for the server to process the disconnection
    await left
  }

  // Test spawn event on login
  let spawnBot = join()
  await once(spawnBot, 'spawn')
  const received = onceWithCleanup(spawnBot.inventory, 'updateSlot', { timeout: 10000, checkCondition: (slot, oldItem, newItem) => newItem?.name === 'snowball' })
  bot.chat('/give spawnbot snowball 16')
  await received
  await leave(spawnBot)

  // A spawn listener can use items at once: 1.21.4+ servers ignore item use until the client
  // has reported its level loaded, which must therefore happen before spawn is announced.
  spawnBot = join()
  const thrown = new Promise((resolve, reject) => {
    spawnBot.once('spawn', () => {
      if (spawnBot.heldItem?.name !== 'snowball') return reject(new Error(`spawned holding ${spawnBot.heldItem?.name}`))
      onceWithCleanup(spawnBot, 'entitySpawn', { timeout: 10000, checkCondition: entity => /snowball/i.test(entity.name) })
        .then(resolve, () => reject(new Error('the server ignored an item used on spawn')))
      spawnBot.activateItem()
    })
  })
  // Have the bot rejoin facing a chest at eye level, centred in the chunk so that the terrain
  // under the bot and the chest arrive together.
  const center = bot.entity.position.floored()
  const x = (center.x >> 4) * 16 + 8
  const z = (center.z >> 4) * 16 + 8
  const y = bot.test.groundY
  const chestPosition = new Vec3(x - 1, y + 1, z)
  try {
    await thrown
    // Operators bypass spawn protection, which would otherwise refuse the click this close to spawn
    bot.chat('/op spawnbot')
    bot.chat(`/fill ${x - 2} ${y} ${z - 1} ${x + 1} ${y + 2} ${z + 1} air`)
    await bot.test.setBlock({ ...chestPosition, blockName: 'chest' })
    const standing = new Vec3(x + 0.5, y, z + 0.5)
    const moved = onceWithCleanup(spawnBot, 'forcedMove', { timeout: 10000, checkCondition: () => spawnBot.entity.position.distanceTo(standing) < 0.01 })
    bot.chat(`/tp spawnbot ${standing.x} ${standing.y} ${standing.z} 90 0`)
    await moved
  } finally {
    await leave(spawnBot)
  }

  // A spawn listener can activate a block at once: servers refuse block interactions until the
  // client confirms their latest teleport (and, on 1.21.4+, reports its level loaded). The bot
  // spawns facing the chest, so activating the face under its crosshair needs no turn.
  spawnBot = join()
  const opened = new Promise((resolve, reject) => {
    const activate = () => {
      const chest = spawnBot.blockAtCursor(4)
      if (!chest?.position.equals(chestPosition)) return reject(new Error(`spawned facing ${chest?.name ?? 'nothing'} at ${chest?.position}`))
      let windowOpened = false
      spawnBot._client.once('open_window', () => { windowOpened = true })
      // The server answers every block click with the clicked block, after opening the chest if it accepted the click
      onceWithCleanup(spawnBot._client, 'block_change', { timeout: 10000, checkCondition: packet => chestPosition.equals(new Vec3(packet.location.x, packet.location.y, packet.location.z)) })
        .then(() => windowOpened ? resolve() : reject(new Error('the server refused a block activated on spawn')),
          () => reject(new Error('the server did not answer a block activated on spawn')))
      spawnBot.activateBlock(chest, new Vec3(1, 0, 0), chest.intersect.minus(chest.position)).catch(reject)
    }
    spawnBot.once('spawn', () => {
      // 1.21.4+ spawn waits for the chunk under the bot, which holds the chest. Earlier versions
      // announce spawn without waiting for terrain, so there the chest is clicked once it loads.
      if (spawnBot.blockAt(chestPosition) || spawnBot.supportFeature('sendsPlayerLoadedPacket')) return activate()
      onceWithCleanup(spawnBot, 'chunkColumnLoad', { timeout: 10000, checkCondition: () => spawnBot.blockAt(chestPosition) })
        .then(activate, reject)
    })
  })
  try {
    await opened
  } finally {
    await leave(spawnBot)
  }

  // Test spawn event on death
  bot.test.sayEverywhere(`/kill ${bot.username}`)
  await once(bot, 'spawn')
}
