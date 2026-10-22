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
  await bot.dig(bot.blockAt(position))
  // make sure that block is gone
  assert.notStrictEqual(bot.blockAt(position).name, blockName)
}
