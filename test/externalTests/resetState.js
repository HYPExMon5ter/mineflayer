const assert = require('assert')
const { onceWithCleanup } = require('../../lib/promise_utils')
const bed = require('./bed')

// A dropped item that outlives its test is picked up in a later one, which then finds it in a slot
// it set (see removeAllDrops in plugins/testCommon.js)
module.exports = () => {
  async function assertNoDrops (bot) {
    // A drop the server still has is announced to the client by the end of its tick
    await bot.test.waitForServerTick()
    const drops = Object.values(bot.entities).filter(bot.test.isDroppedItem)
    assert.deepStrictEqual(drops.map(drop => `item entity ${drop.id} at ${drop.position}`), [], 'the reset left dropped items')
  }

  return {
    // From 1.13 the reset's fill removes one half of the bed, and the other half breaks and drops the
    // bed item (older servers break it without a drop)
    'removes the item its own fills drop': async (bot) => {
      await bed()(bot)
      await bot.test.resetState()
      await assertNoDrops(bot)
    },
    // Nothing changed a block, so the reset skips its fills
    'removes a stack the test tossed': async (bot) => {
      const Item = require('prismarine-item')(bot.registry)
      await bot.test.setInventorySlot(36, new Item(bot.registry.itemsByName.stone.id, 1))
      const tossed = onceWithCleanup(bot, 'entitySpawn', { timeout: 5000, checkCondition: bot.test.isDroppedItem })
      await bot.tossStack(bot.inventory.slots[36])
      await tossed
      await bot.test.resetState()
      await assertNoDrops(bot)
    }
  }
}
