const assert = require('assert')
const { onceWithCleanup } = require('../../lib/promise_utils')

// Digs blocks with a tool vanilla speeds up on them, which digEverything's pickaxe cannot check:
// - the bot's dig time is what vanilla's formula gives with the tool's vanilla speed, so a tool
//   missing from the data (a slower dig) fails
// - the server breaks the block at that time, so a speed the server does not apply (a dig it
//   refuses or delays) fails; the server accepts a finish from 70% of the progress, so this catches
//   a speed well above vanilla's, not a small difference
// Speeds from the vanilla server: ToolMaterial (wood 2, copper 5), shears 5 on wool, swords 15 on
// cobweb, and swords break bamboo at once (BambooStalkBlock, from 1.21.5 #sword_instantly_mines).
const cases = [
  { block: ['web', 'cobweb'], tool: 'wooden_sword', speed: 15 },
  { block: ['wool', 'white_wool'], tool: 'shears', speed: 5 },
  // the vanilla mineable tags, compared with the data from 1.17
  { block: 'bamboo', tool: 'wooden_axe', speed: 2, since: '1.17' },
  { block: 'moss_carpet', tool: 'wooden_hoe', speed: 2, since: '1.17' },
  { block: 'straw_bed', tool: 'wooden_hoe', speed: 2, since: '26.3' },
  { block: 'stone', tool: 'copper_pickaxe', speed: 5, since: '1.21.9' },
  // swords by tag, compared with the data from 1.20
  { block: 'bamboo', tool: 'wooden_sword', speed: Infinity, since: '1.20' }
]

module.exports = (version) => {
  const registry = require('prismarine-registry')(version)
  const tests = {}
  for (const { block, tool, speed, since } of cases) {
    const blockName = [block].flat().find(name => registry.blocksByName[name])
    if (!blockName || !registry.itemsByName[tool] || (since && registry.version['<'](since))) continue
    tests[`${blockName} with ${tool}`] = bot => digWith(bot, blockName, tool, speed)
  }
  return tests
}

async function digWith (bot, blockName, toolName, speed) {
  const Item = require('prismarine-item')(bot.registry)
  const position = bot.entity.position.floored().offset(1, 0, 0)
  await bot.test.setBlock({ x: 1, relative: true, blockName })
  const block = bot.blockAt(position)
  assert.strictEqual(block.name, blockName, `could not create ${blockName}`)
  const tool = bot.registry.itemsByName[toolName].id
  await bot.test.setInventorySlot(36, new Item(tool, 1, 0))
  bot.setQuickBarSlot(0)
  await bot.test.becomeSurvival()
  if (!bot.entity.onGround) await onceWithCleanup(bot, 'physicsTick', { timeout: 5000, checkCondition: () => bot.entity.onGround })

  // vanilla: progress per tick = speed / hardness / (30 if the tool harvests the block, else 100)
  const progress = speed / block.hardness / (block.canHarvest(tool) ? 30 : 100)
  const expected = progress >= 1 ? 0 : Math.ceil(1 / progress) * 50
  assert.strictEqual(bot.digTime(block), expected, `dig time of ${blockName} with ${toolName}`)
  await bot.test.digChecked(position, blockName)
  await bot.test.removeDrops(position)
}
