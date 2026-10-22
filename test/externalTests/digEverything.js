const assert = require('assert')
const { onceWithCleanup } = require('../../lib/promise_utils')

// Digs every diggable block: about an hour per version, so it only runs with RUN_EXCLUDED_TESTS=1

const excludedBlocks = [
  // broken
  'bed',
  'double_stone_slab',
  'wooden_door',
  'iron_door',
  'redstone_ore',
  'lit_redstone_ore',
  'trapdoor',
  'double_wooden_slab',
  'jungle_stairs',
  'flower_pot',
  'carrots',
  'potatoes',
  'skull',
  'unpowered_comparator',
  'standing_banner',
  'wall_banner',
  'daylight_detector',
  'stone_slab2',
  'spruce_door',
  'birch_door',
  'jungle_door',
  'acacia_door',
  'dark_oak_door',

  // cannot be placed
  'piston_extension',
  'fire',
  'standing_sign',
  'reeds',
  'powered_repeater',
  'pumpkin_stem',
  'melon_stem',
  'brewing_stand',
  'cauldron',
  'lit_redstone_lamp',
  'tripwire',

  // cause problems
  'mob_spawner',
  'obsidian',

  // not blocks a player can break
  'air',
  'cave_air',
  'void_air',
  'water',
  'lava'
]

module.exports = (version) => {
  const registry = require('prismarine-registry')(version)

  const funcs = {}
  for (const block of registry.blocksArray) {
    if (block.diggable && excludedBlocks.indexOf(block.name) === -1) {
      funcs[block.name] = bot => digSomething(block.name, bot)
    }
  }

  return funcs
}

// Creates the block with /setblock rather than by placing an item: not every block has an
// item of the same name, and block IDs are not item IDs since 1.13.
async function digSomething (blockName, bot) {
  const Item = require('prismarine-item')(bot.registry)
  const position = bot.entity.position.floored().offset(1, 0, 0)

  await bot.test.setBlock({ x: 1, relative: true, blockName })
  assert.strictEqual(bot.blockAt(position).name, blockName, `could not create ${blockName}`)
  await bot.test.setInventorySlot(36, new Item(bot.registry.itemsByName.diamond_pickaxe.id, 1, 0))
  bot.setQuickBarSlot(0)
  await bot.test.becomeSurvival()
  // Leaving creative can leave the bot airborne for a moment, which makes digging five times slower
  if (!bot.entity.onGround) await onceWithCleanup(bot, 'physicsTick', { timeout: 5000, checkCondition: () => bot.entity.onGround })
  // An infested block releases a silverfish, which would attack the bot while it digs later blocks
  const silverfishName = bot.supportFeature('entityNameUpperCaseNoUnderscore') ? 'Silverfish' : 'silverfish'
  const released = /^(monster_egg|infested_)/.test(blockName)
    ? onceWithCleanup(bot, 'entitySpawn', { timeout: 5000, checkCondition: entity => entity.name === silverfishName })
    : null
  released?.catch(() => {}) // awaited below; only keeps a failed dig from leaving it unhandled
  const acknowledgements = digAcknowledgements(bot)
  await bot.dig(bot.blockAt(position))
  // bot.dig resolves on the client's own prediction, before the server has handled the finish.
  // 26.3 queues digging packets for its next tick but runs commands as they arrive, so the next
  // test's /setblock could run first and the late break would remove that block. From 1.19 the
  // server acknowledges each digging packet's sequence once handled; earlier servers handle
  // commands and digging packets in order, so a command round trip is enough. A block the server
  // kept has been resent by then, so this checks the server's result, not the prediction.
  if (acknowledgements) {
    await acknowledgements.handled()
    // A break the server found too fast is delayed without a block update, and the bot keeps its
    // prediction, so ask the server whether the block is still there.
    const feedback = onceWithCleanup(bot, 'messagestr', { timeout: 5000, checkCondition: message => /^Test (passed|failed)/.test(message) })
    bot.chat(`/execute unless block ${position.x} ${position.y} ${position.z} minecraft:${blockName}`)
    const [result] = await feedback
    assert.match(result, /^Test passed/, `the server still has ${blockName} after the dig`)
  } else {
    await bot.test.awaitCommandsProcessed(`dug ${blockName}`)
  }
  assert.notStrictEqual(bot.blockAt(position).name, blockName)
  if (released) {
    const [silverfish] = await released
    await bot.test.killEntity(silverfish)
  }
}

// Tracks the last block prediction sequence the bot sent and the highest one the server
// acknowledged, so a wait can tell whether everything sent so far has been handled (1.19+).
function digAcknowledgements (bot) {
  const ack = bot.registry.protocol?.play?.toClient?.types?.packet_acknowledge_player_digging
  if (!ack?.[1]?.some(field => field.name === 'sequenceId')) return null
  if (bot.test.digAcknowledgements) return bot.test.digAcknowledgements

  const state = { sent: 0, acknowledged: 0 }
  const nextSequence = bot._nextSequence
  bot._nextSequence = () => (state.sent = nextSequence())
  bot._client.on('acknowledge_player_digging', ({ sequenceId }) => {
    state.acknowledged = Math.max(state.acknowledged, sequenceId)
  })
  state.handled = async () => {
    if (state.acknowledged >= state.sent) return
    const sent = state.sent
    await onceWithCleanup(bot._client, 'acknowledge_player_digging', { timeout: 5000, checkCondition: ({ sequenceId }) => sequenceId >= sent })
  }
  bot.test.digAcknowledgements = state
  return state
}
