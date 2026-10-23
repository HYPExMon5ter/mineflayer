const assert = require('assert')
const { onceWithCleanup } = require('../../lib/promise_utils')

// Digs every diggable block: from 5 minutes (1.8) to 45 minutes (26.3) per version, so it only
// runs with RUN_EXCLUDED_TESTS=1

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

  // break at once without support the flat test world does not give them (sand, water, end stone,
  // soul soil, a ceiling, a wall), so /setblock cannot keep them to dig
  'cactus',
  'sugar_cane',
  'kelp_plant',
  'chorus_plant',
  'chorus_flower',
  'soul_fire',
  'weeping_vines',
  'weeping_vines_plant',
  'twisting_vines_plant',
  'cave_vines',
  'cave_vines_plant',
  'big_dripleaf_stem',
  'pale_hanging_moss',

  // cause problems
  'mob_spawner',
  'obsidian',

  // not blocks a player can break
  'air',
  'cave_air',
  'void_air',
  'water',
  'lava',
  'bubble_column'
]

// Coral wall fans need the wall they face
const excludedPattern = /_coral_wall_fan$/

// These versions ship the next update's blocks behind an experimental feature flag, which the
// test servers do not enable, so /setblock rejects them: test only the blocks of the last
// version without the experiment, plus blocks renamed since.
const withoutExperiments = {
  '1.19.3': { base: '1.19.2' },
  '1.19.4': { base: '1.19.2' },
  '1.20.4': { base: '1.20.2', renamed: ['short_grass'] },
  '1.20.6': { base: '1.20.2', renamed: ['short_grass'] },
  '1.21.3': { base: '1.21.1' }
}

function releasedBlocks (version) {
  const released = withoutExperiments[version]
  if (!released) return null
  return new Set([...require('prismarine-registry')(released.base).blocksArray.map(block => block.name), ...(released.renamed ?? [])])
}

module.exports = (version) => {
  const registry = require('prismarine-registry')(version)
  const released = releasedBlocks(version)

  const funcs = {}
  for (const block of registry.blocksArray) {
    if (block.diggable && excludedBlocks.indexOf(block.name) === -1 && !excludedPattern.test(block.name) && (!released || released.has(block.name))) {
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

  // Blocks placed waterlogged (conduit, corals, sea pickles) would let water push the bot and
  // slow its digging, so create them dry. Leaves away from logs can decay as soon as they are
  // set, so create them persistent, as player-placed leaves are.
  const Block = require('prismarine-block')(bot.registry)
  const properties = Block.fromStateId(bot.registry.blocksByName[blockName].defaultState, 0).getProperties()
  const states = []
  if (properties.waterlogged === true) states.push('waterlogged=false')
  if (properties.persistent === false) states.push('persistent=true')
  await bot.test.setBlock({ x: 1, relative: true, blockName, states: states.length ? `[${states.join(',')}]` : '' })
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
  await bot.test.digChecked(position, blockName)
  await bot.test.removeDrops(position)
  if (released) {
    const [silverfish] = await released
    await bot.test.killEntity(silverfish)
  }
}
