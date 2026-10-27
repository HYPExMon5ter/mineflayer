const assert = require('assert')

// 26.3 sign items carry their text as sign_text_front/sign_text_back components. The server
// writes the filtered messages as an optional list, so a misread one breaks the whole slot packet.
module.exports = () => async (bot) => {
  if (!bot.registry.isNewerOrEqualTo('26.3')) return
  await bot.test.becomeCreative()
  await bot.test.clearInventory()
  await bot.test.awaitItemReceived(`/give ${bot.username} minecraft:oak_sign[minecraft:sign_text_front={messages:["Front","","",""]},minecraft:sign_text_back={messages:["Back","","",""],filtered_messages:["Kept","","",""],color:"red",has_glowing_text:true}] 1`)
  // The stack after the sign must still be read from the same packet.
  await bot.test.awaitItemReceived(`/give ${bot.username} minecraft:stone 3`)

  const sign = bot.inventory.items().find(item => item.name === 'oak_sign')
  assert.ok(sign, `no oak sign in ${bot.inventory.items().map(item => item.name)}`)
  const component = type => sign.components.find(c => c.type === type)?.data
  const text = message => JSON.stringify(message)

  const front = component('sign_text_front')
  assert.ok(front, `sign components: ${sign.components.map(c => c.type)}`)
  assert.match(text(front.messages[0]), /Front/)
  assert.strictEqual(front.filteredMessages, undefined)
  assert.strictEqual(front.hasGlowingText, false)

  const back = component('sign_text_back')
  assert.match(text(back.messages[0]), /Back/)
  assert.match(text(back.filteredMessages?.[0]), /Kept/)
  assert.strictEqual(back.color, 14) // DyeColor id of red
  assert.strictEqual(back.hasGlowingText, true)

  const stone = bot.inventory.items().find(item => item.name === 'stone')
  assert.strictEqual(stone?.count, 3)
}
