const mineflayer = require('mineflayer')
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
  try {
    await thrown
  } finally {
    await leave(spawnBot)
  }

  // Test spawn event on death
  bot.test.sayEverywhere(`/kill ${bot.username}`)
  await once(bot, 'spawn')
}
