const assert = require('assert')
const { onceWithCleanup } = require('../../lib/promise_utils')

module.exports = () => async (bot) => {
  const Item = require('prismarine-item')(bot.registry)

  const furnacePos = bot.entity.position.offset(2, 0, 0).floored()
  const coalId = bot.registry.itemsByName.coal.id
  const porkchopId = bot.registry.itemsByName.porkchop.id
  const cookedPorkchopId = bot.registry.itemsByName.cooked_porkchop.id
  const coalInputCount = 2
  const porkchopInputCount = 2

  // While the furnace cooks, the server sends its cook time (window property 2) every tick, so
  // counting those updates measures server ticks: these waits fail when the server did not do
  // what was asked within maxTicks of its own time, however slowly a loaded machine runs it.
  function waitForCookTime (description, condition, maxTicks) {
    return new Promise((resolve, reject) => {
      const seen = []
      const stalled = setTimeout(() => finish(new Error(`${description}: no cook time update for 30 s after ${seen.join(', ')}`)), 30000)
      function onProperty (packet) {
        if (packet.windowId !== furnace.id || packet.property !== 2) return
        seen.push(packet.value)
        stalled.refresh()
        if (condition(packet.value)) finish()
        else if (seen.length >= maxTicks) finish(new Error(`${description} did not happen within ${maxTicks} server ticks; cook times ${seen.join(', ')}`))
      }
      function finish (error) {
        clearTimeout(stalled)
        bot._client.removeListener('craft_progress_bar', onProperty)
        if (error) reject(error)
        else resolve()
      }
      bot._client.on('craft_progress_bar', onProperty)
    })
  }

  // Test setup
  await bot.test.setInventorySlot(36, new Item(bot.registry.itemsByName.furnace.id, 1))
  await bot.test.placeBlock(36, furnacePos)
  await bot.test.setInventorySlot(37, new Item(porkchopId, porkchopInputCount))
  await bot.test.setInventorySlot(38, new Item(coalId, coalInputCount)) // Get coal
  if (bot.supportFeature('itemsAreAlsoBlocks')) {
    assert.strictEqual(bot.blockAt(furnacePos).type, bot.registry.itemsByName.furnace.id)
  } else {
    assert.strictEqual(bot.blockAt(furnacePos).type, bot.registry.blocksByName.furnace.id)
  }

  // Put inputs
  const furnace = await bot.openFurnace(bot.blockAt(furnacePos))
  assert.strictEqual(furnace.inputItem(), furnace.slots[0])
  assert.strictEqual(furnace.fuelItem(), furnace.slots[1])
  assert.strictEqual(furnace.outputItem(), furnace.slots[2])
  assert.strictEqual(furnace.inputItem(), null)
  assert.strictEqual(furnace.fuelItem(), null)
  assert.strictEqual(furnace.outputItem(), null)

  await furnace.putFuel(coalId, null, coalInputCount)

  assert.strictEqual(furnace.fuelItem(), furnace.slots[1])
  assert.strictEqual(furnace.fuelItem().type, coalId)
  assert.strictEqual(furnace.fuelItem().count, coalInputCount)

  await furnace.putInput(porkchopId, null, porkchopInputCount)

  assert.strictEqual(furnace.inputItem(), furnace.slots[0])
  assert.strictEqual(furnace.inputItem().type, porkchopId)
  assert.strictEqual(furnace.inputItem().count, porkchopInputCount)

  // Burning starts on the next server tick; the window properties carrying
  // fuel and progress arrive as furnace updates, not with the item packets.
  await onceWithCleanup(furnace, 'update', {
    timeout: 5000,
    checkCondition: () => furnace.fuel > 0 && furnace.fuel < 1 && furnace.progress > 0 && furnace.progress < 1
  })
  assert(furnace.fuel > 0 && furnace.fuel < 1)
  assert(furnace.progress > 0 && furnace.progress < 1)

  // The furnace only completes on cookTime == totalCookTime (not >=), so the
  // merged value must stay below 200.
  const { x, y, z } = furnacePos
  const cookTimeKey = bot.supportFeature('furnaceNbtUsesSnakeCase') ? 'cooking_time_spent' : 'CookTime'
  const merged = waitForCookTime('the cook time merge', cookTime => cookTime >= 195, 40)
  if (bot.supportFeature('hasDataCommand')) {
    bot.chat(`/data merge block ${x} ${y} ${z} {${cookTimeKey}:195s}`)
  } else {
    bot.chat(`/blockdata ${x} ${y} ${z} {${cookTimeKey}:195s}`)
  }
  await merged
  // 5 more ticks complete the porkchop; the output arrives before the reset cook time
  if (furnace.outputItem() === null) await waitForCookTime('the smelted output', () => furnace.outputItem() !== null, 20)
  assert.strictEqual(furnace.outputItem(), furnace.slots[2])
  assert.strictEqual(furnace.outputItem().type, cookedPorkchopId)
  assert.strictEqual(furnace.outputItem().count, 1)

  assert.strictEqual(furnace.inputItem().type, porkchopId)
  assert.strictEqual(furnace.inputItem().count, porkchopInputCount - 1)

  assert.strictEqual(furnace.fuelItem().type, coalId)
  assert.strictEqual(furnace.fuelItem().count, coalInputCount - 1)

  await furnace.takeOutput()
  await furnace.takeInput()
  await furnace.takeFuel()
  await furnace.close()

  // Check inventory
  const cookedPorkchopCount = bot.inventory.count(cookedPorkchopId)
  const porkchopCount = bot.inventory.count(porkchopId)
  const coalCount = bot.inventory.count(coalId)

  assert.strictEqual(cookedPorkchopCount, 1)
  assert.strictEqual(porkchopCount, porkchopInputCount - 1)
  assert.strictEqual(coalCount, coalInputCount - 1)
}
