const assert = require('assert')

// From 1.20.5 a potion carries its contents as a potion_contents item component. The custom name
// at its end only exists from 1.21.2, and reading one from an older server breaks the whole slot
// packet: a water bottle caught while fishing did not reach a 1.20.6 bot.
module.exports = () => async (bot) => {
  if (!bot.supportFeature('itemsWithComponents')) return
  const hasCustomName = bot.registry.isNewerOrEqualTo('1.21.2')
  await bot.test.becomeCreative()
  await bot.test.clearInventory()
  await bot.test.awaitItemReceived(`/give ${bot.username} minecraft:potion[minecraft:potion_contents={potion:"minecraft:water"}] 1`)
  const contents = '{potion:"minecraft:swiftness",custom_color:16711680,custom_effects:[{id:"minecraft:speed",amplifier:1b,duration:200}]' +
    (hasCustomName ? ',custom_name:"quick"}' : '}')
  await bot.test.awaitItemReceived(`/give ${bot.username} minecraft:splash_potion[minecraft:potion_contents=${contents}] 1`)
  // The stack after the potions must still be read from the same packets.
  await bot.test.awaitItemReceived(`/give ${bot.username} minecraft:stone 3`)

  const potionContents = name => {
    const item = bot.inventory.items().find(item => item.name === name)
    assert.ok(item, `no ${name} in ${bot.inventory.items().map(item => item.name)}`)
    const data = item.components.find(c => c.type === 'potion_contents')?.data
    assert.ok(data, `${name} components: ${item.components.map(c => c.type)}`)
    return data
  }

  const water = potionContents('potion')
  assert.strictEqual(water.customColor, undefined)
  assert.deepStrictEqual(water.customEffects, [])

  const swiftness = potionContents('splash_potion')
  assert.notStrictEqual(swiftness.potionId, water.potionId)
  assert.strictEqual(swiftness.customColor, 16711680)
  assert.strictEqual(swiftness.customEffects.length, 1)
  assert.strictEqual(swiftness.customEffects[0].details.amplifier, 1)
  assert.strictEqual(swiftness.customEffects[0].details.duration, 200)
  if (hasCustomName) assert.strictEqual(swiftness.customName, 'quick')

  const stone = bot.inventory.items().find(item => item.name === 'stone')
  assert.strictEqual(stone?.count, 3)
}
