const assert = require('assert')
const { sleep, once, onceWithCleanup } = require('../promise_utils')

module.exports = inject

function inject (bot) {
  const Item = require('prismarine-item')(bot.registry)
  const ChatMessage = require('prismarine-chat')(bot.registry)

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

    // The name an anvil keeps for this item: the plain text of its custom name, '' without one
    function plainName (item) {
      const name = item.customName
      if (name == null) return ''
      // plain text before 1.13, a JSON text component from then on
      return bot.registry.version['<']('1.13') ? name : ChatMessage.fromNotch(name).toString()
    }

    // The vanilla client sends the name field each time it changes, so the server sees each prefix
    async function typeName (name) {
      if (!name) return sendItemName('')
      for (let i = 1; i < name.length + 1; i++) {
        sendItemName(name.substring(0, i))
        await sleep(50)
      }
    }

    // Like the vanilla client, which fills the name field with the item's name, send the current
    // name before the inputs: the server keeps the last name of this window, and with it the first
    // input alone would already give a renamed result. With the item's own name, nothing changes
    // until every input is in place, so the only result with the final name and, for a combine,
    // the increased repair cost of both inputs is the result of the complete operation.
    async function useAnvil (left, right, name) {
      const currentName = plainName(left)
      const finalName = name ?? currentName
      sendItemName(currentName)
      if (!bot.supportFeature('useMCItemName')) sendItemName(currentName) // sent like this by vanilla
      await putItem(0, left)
      if (right) await putItem(1, right)
      if (finalName !== currentName) await typeName(finalName)
      await takeResult(item => item.type === left.type && plainName(item) === finalName &&
        (!right || item.repairCost === Math.max(left.repairCost, right.repairCost) * 2 + 1))
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
      if (normalCost === 0) await useAnvil(itemTwo, itemOne, name)
      else if (inverseCost === 0) await useAnvil(itemOne, itemTwo, name)
      else if (normalCost < inverseCost) await useAnvil(itemOne, itemTwo, name)
      else await useAnvil(itemTwo, itemOne, name)
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
      await useAnvil(item, null, name)
      await xpPromise
    }

    // Without click confirmations (1.17+) nothing delays the output click until the server's
    // result has arrived. Clicking an output the window does not show yet takes the result
    // onto the server's cursor while the bot believes it holds nothing, and before 1.17 a click
    // on an earlier result is refused. So wait until the output is the result of the operation.
    async function takeResult (ready) {
      const isReady = item => item != null && ready(item)
      if (!isReady(anvil.slots[2])) {
        await onceWithCleanup(anvil, 'updateSlot:2', { timeout: 20000, checkCondition: (oldItem, newItem) => isReady(newItem) })
      }
      await bot.putAway(2)
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
