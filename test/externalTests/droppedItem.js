const assert = require('assert')
const { onceWithCleanup } = require('../../lib/promise_utils')

// getDroppedItem reads the stack from the metadata key minecraft-data gives the version
// (metadataIxOfItem), so a wrong key returns nothing or throws
module.exports = () => async (bot) => {
  const Item = require('prismarine-item')(bot.registry)
  const item = new Item(bot.registry.itemsByName.stone.id, 7)
  item.customName = bot.registry.isOlderThan('1.13') ? 'Dropped stack' : JSON.stringify({ text: 'Dropped stack' })
  await bot.test.setInventorySlot(36, item)

  const dropped = onceWithCleanup(bot, 'itemDrop', { timeout: 5000 })
  await bot.tossStack(bot.inventory.slots[36])
  const [entity] = await dropped

  const stack = entity.getDroppedItem()
  assert.ok(stack, `item entity ${entity.id} has no stack at metadata key ${bot.supportFeature('metadataIxOfItem')} (keys: ${Object.keys(entity.metadata)})`)
  assert.strictEqual(stack.name, 'stone')
  assert.strictEqual(stack.count, 7)
  assert.strictEqual(stack.metadata, item.metadata)
  assert.strictEqual(stack.customName, item.customName)
}
