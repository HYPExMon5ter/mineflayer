/* eslint-env mocha */

const EventEmitter = require('events')
const assert = require('assert')
const { Vec3 } = require('vec3')
const inject = require('../lib/plugins/digging')

// A dig request for a block that cannot be dug must leave an active dig alone: no turning
// and no START/ABORT packets for the current target.
describe('digging an undiggable block while digging', () => {
  function setup () {
    const bot = new EventEmitter()
    bot.supportFeature = () => false
    bot.packets = []
    bot._client = { write: (name, params) => bot.packets.push({ name, params }) }
    bot._nextSequence = () => 0
    bot._updateBlockState = () => {}
    bot.swingArm = () => {}
    bot.looks = 0
    bot.lookAt = async () => { bot.looks++ }
    inject(bot)
    const block = (name, x) => ({ name, position: new Vec3(x, 64, 0), shapes: [[0, 0, 0, 1, 1, 1]] })
    const stone = block('stone', 0)
    const times = { stone: 60000, bedrock: Infinity, glass: 500 }
    bot.digTime = target => times[target.name]
    const active = bot.dig(stone, 'ignore').catch(err => err)
    return { bot, stone, block, times, active }
  }

  async function finish ({ bot, active }) {
    bot.stopDigging()
    assert.match((await active).message, /Digging aborted/)
  }

  it('rejects before turning when the block is undiggable from the start', async () => {
    const context = setup()
    const { bot, stone, block } = context
    await new Promise(resolve => setImmediate(resolve))
    assert.strictEqual(bot.targetDigBlock, stone)
    const started = bot.packets.length

    await assert.rejects(bot.dig(block('bedrock', 1)), /dig time for bedrock is Infinity/)

    assert.strictEqual(bot.looks, 0)
    assert.strictEqual(bot.packets.length, started)
    assert.strictEqual(bot.targetDigBlock, stone)
    await finish(context)
  })

  it('keeps the active dig when the block becomes undiggable while aiming', async () => {
    const context = setup()
    const { bot, stone, block, times } = context
    await new Promise(resolve => setImmediate(resolve))
    const started = bot.packets.length
    bot.lookAt = async () => { times.glass = Infinity }

    await assert.rejects(bot.dig(block('glass', 1)), /dig time for glass is Infinity/)

    assert.strictEqual(bot.packets.length, started)
    assert.strictEqual(bot.targetDigBlock, stone)
    await finish(context)
  })

  it('still replaces the active dig with a diggable block', async () => {
    const context = setup()
    const { bot, block, active } = context
    await new Promise(resolve => setImmediate(resolve))
    const glass = block('glass', 1)
    const next = bot.dig(glass).catch(err => err)
    await new Promise(resolve => setImmediate(resolve))
    assert.match((await active).message, /Digging aborted/)
    assert.deepStrictEqual(bot.packets.slice(-2).map(p => p.params.status), [1, 0])
    assert.strictEqual(bot.targetDigBlock, glass)
    bot.stopDigging()
    await next
  })
})
