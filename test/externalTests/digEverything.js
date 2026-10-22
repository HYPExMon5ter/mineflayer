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
  await bot.dig(bot.blockAt(position))
  // bot.dig resolves on the client's own prediction, before the server has handled the finish.
  // 26.3 queues digging packets for its next tick but runs commands as they arrive, so the next
  // test's /setblock could run first and the late break would remove that block. From 1.19 the
  // server acknowledges digging packets once handled; earlier servers handle commands and digging
  // packets in order, so a command round trip is enough. A block the server kept has been resent
  // by then, so this checks the server's result, not the prediction.
  if (acknowledgesBySequence(bot)) {
    await onceWithCleanup(bot._client, 'acknowledge_player_digging', { timeout: 5000 })
  } else {
    await bot.test.awaitCommandsProcessed(`dug ${blockName}`)
  }
  assert.notStrictEqual(bot.blockAt(position).name, blockName)
  if (released) {
    const [silverfish] = await released
    await bot.test.killEntity(silverfish)
  }
}

function acknowledgesBySequence (bot) {
  const ack = bot.registry.protocol?.play?.toClient?.types?.packet_acknowledge_player_digging
  return ack?.[1]?.some(field => field.name === 'sequenceId') ?? false
}
