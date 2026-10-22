const assert = require('assert')
const { sleep, once, onceWithCleanup } = require('../promise_utils')

module.exports = inject

function inject (bot) {
  const Item = require('prismarine-item')(bot.registry)

  const matchWindowType = window => /minecraft:(?:chipped_|damaged_)?anvil/.test(window.type)

  async function openAnvil (anvilBlock) {
    const anvil = await bot.openBlock(anvilBlock)
    if (!matchWindowType(anvil)) {
      throw new Error('Not a anvil-like window: ' + JSON.stringify(anvil))
    }

    function err (name) {
      anvil.close()
      throw new Error(name)
    }

    function sendItemName (name) {
      if (bot.supportFeature('useMCItemName')) {
        bot._client.writeChannel('MC|ItemName', name)
      } else {
        bot._client.write('name_item', { name })
      }
    }

    async function addCustomName (name) {
      if (!name) return
      for (let i = 1; i < name.length + 1; i++) {
        sendItemName(name.substring(0, i))
        await sleep(50)
      }
    }
    async function putInAnvil (itemOne, itemTwo) {
      await putItem(0, itemOne)
      sendItemName('') // sent like this by vnailla
      if (!bot.supportFeature('useMCItemName')) sendItemName('')
      await putItem(1, itemTwo)
    }

    // The anvil window slot of the given item, which may come from the anvil window or from
    // bot.inventory. Searching by type and NBT instead cannot tell 1.20.5+ items apart: their
    // enchantments are components, so it could take another item of the same type.
    function windowSlotOf (item) {
      if (anvil.slots[item.slot] === item) return item.slot
      if (bot.inventory.slots[item.slot] !== item || item.slot < bot.inventory.inventoryStart) return null
      const slot = item.slot - bot.inventory.inventoryStart + anvil.inventoryStart
      return anvil.slots[slot]?.type === item.type ? slot : null
    }

    async function putItem (destSlot, item) {
      const sourceSlot = windowSlotOf(item)
      if (sourceSlot === null) return putSomething(destSlot, item.type, item.metadata, item.count, item.nbt)
      await bot.clickWindow(sourceSlot, 0, 0)
      await bot.clickWindow(destSlot, 0, 0)
    }

    async function combine (itemOne, itemTwo, name) {
      const nameLimit = bot.supportFeature('anvilNameLengthIsFifty') ? 50 : 35
      if (name?.length > nameLimit) err('Name is too long.')
      if (bot.supportFeature('useMCItemName')) {
        bot._client.registerChannel('MC|ItemName', 'string')
      }

      assert.ok(itemOne && itemTwo)
      const { xpCost: normalCost } = Item.anvil(itemOne, itemTwo, bot.game.gameMode === 'creative', name)
      const { xpCost: inverseCost } = Item.anvil(itemTwo, itemOne, bot.game.gameMode === 'creative', name)
      if (normalCost === 0 && inverseCost === 0) err('Not anvil-able (in either direction), cancelling.')

      const smallest = (normalCost < inverseCost ? normalCost : inverseCost) === 0 ? inverseCost : 0
      if (bot.game.gameMode !== 'creative' && bot.experience.level < smallest) {
        err('Player does not have enough xp to do action, cancelling.')
      }

      const xpPromise = bot.game.gameMode === 'creative' ? Promise.resolve() : once(bot, 'experience')
      if (normalCost === 0) await putInAnvil(itemTwo, itemOne)
      else if (inverseCost === 0) await putInAnvil(itemOne, itemTwo)
      else if (normalCost < inverseCost) await putInAnvil(itemOne, itemTwo)
      else await putInAnvil(itemTwo, itemOne)

      await addCustomName(name)
      await takeResult(name)
      await xpPromise
    }

    async function rename (item, name) {
      const nameLimit = bot.supportFeature('anvilNameLengthIsFifty') ? 50 : 35
      if (name?.length > nameLimit) err('Name is too long.')
      if (bot.supportFeature('useMCItemName')) {
        bot._client.registerChannel('MC|ItemName', 'string')
      }
      assert.ok(item)
      const { xpCost: normalCost } = Item.anvil(item, null, bot.game.gameMode === 'creative', name)
      if (normalCost === 0) err('Not valid rename, cancelling.')

      if (bot.game.gameMode !== 'creative' && bot.experience.level < normalCost) {
        err('Player does not have enough xp to do action, cancelling.')
      }
      const xpPromise = once(bot, 'experience')
      await putItem(0, item)
      sendItemName('') // sent like this by vnailla
      if (!bot.supportFeature('useMCItemName')) sendItemName('')
      await addCustomName(name)
      await takeResult(name)
      await xpPromise
    }

    // Without click confirmations (1.17+) nothing delays the output click until the server's
    // result has arrived. Clicking an output the window does not show yet takes the result
    // onto the server's cursor while the bot believes it holds nothing. Each name sent changes
    // the result, so a rename waits for the one with the final name: a click on an earlier
    // result is refused where clicks are confirmed (before 1.17).
    async function takeResult (name) {
      const ready = item => item != null && (!name || hasName(item, name))
      if (!ready(anvil.slots[2])) {
        await onceWithCleanup(anvil, 'updateSlot:2', { timeout: 20000, checkCondition: (oldItem, newItem) => ready(newItem) })
      }
      await bot.putAway(2)
    }

    // customName is plain text before 1.13 and a JSON text component from then on
    function hasName (item, name) {
      const customName = String(item.customName ?? '')
      return customName.includes(name) || customName.includes(JSON.stringify(name).slice(1, -1))
    }

    async function putSomething (destSlot, itemId, metadata, count, nbt) {
      const options = {
        window: anvil,
        itemType: itemId,
        metadata,
        count,
        nbt,
        sourceStart: anvil.inventoryStart,
        sourceEnd: anvil.inventoryEnd,
        destStart: destSlot,
        destEnd: destSlot + 1
      }
      await bot.transfer(options)
    }

    anvil.combine = combine
    anvil.rename = rename

    return anvil
  }

  bot.openAnvil = openAnvil
}
