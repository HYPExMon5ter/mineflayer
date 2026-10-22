/* eslint-env mocha */
const assert = require('assert')
const { EventEmitter } = require('events')
const { onceWithCleanup, withTimeout } = require('../lib/promise_utils')

function makeBot (version = '1.20.4') {
  const bot = new EventEmitter()
  bot.registry = require('prismarine-registry')(version)
  bot.version = version
  bot.supportFeature = bot.registry.supportFeature
  bot._client = new EventEmitter()
  bot.packets = []
  bot._client.write = (name, params) => bot.packets.push({ name, params })
  bot._client.registerChannel = () => {}
  bot._client.writeChannel = () => {}
  return bot
}

describe('audit regressions', () => {
  it('reports unknown menus without crashing or retaining an obsolete open window', () => {
    const bot = makeBot('26.3')
    require('../lib/plugins/inventory')(bot, {})
    const oldWindow = { id: 7 }
    bot.currentWindow = oldWindow
    let closed
    let unknown
    bot.on('windowClose', window => { closed = window })
    bot.on('unknownWindow', packet => { unknown = packet })
    const packet = { windowId: 8, inventoryType: 99999, windowTitle: { type: 'string', value: 'Custom menu' } }
    assert.doesNotThrow(() => bot._client.emit('open_window', packet))
    assert.strictEqual(bot.currentWindow, null)
    assert.strictEqual(closed, oldWindow)
    assert.strictEqual(unknown, packet)
  })

  it('reconciles passengers and clears all relationships before dismount events', () => {
    for (const version of ['1.9.4', '26.3']) {
      const bot = makeBot(version)
      require('../lib/plugins/entities')(bot)
      bot._client.emit('login', { entityId: 0 })
      bot._client.emit('entity_velocity', { entityId: 2, velocity: { x: 0, y: 0, z: 0 } })
      const vehicle = bot.entities[2]
      bot._client.emit('set_passengers', { entityId: 2, passengers: [0, 3] })
      assert.strictEqual(bot.vehicle, vehicle)
      assert.strictEqual(bot.entity.vehicle, vehicle)
      const rider = bot.entities[3]
      let dismounted = 0
      bot.on('dismount', previous => {
        assert.strictEqual(previous, vehicle)
        assert.strictEqual(bot.vehicle, null)
        assert.strictEqual(bot.entity.vehicle, null)
        assert.ok(!vehicle.passengers.includes(bot.entity))
        dismounted++
      })
      bot._client.emit('set_passengers', { entityId: 2, passengers: [3] })
      assert.deepStrictEqual(vehicle.passengers, [rider])
      bot._client.emit('set_passengers', { entityId: 2, passengers: [3, 0] })
      bot._client.emit('entity_destroy', { entityIds: [2] })
      assert.strictEqual(dismounted, 2)
      assert.strictEqual(rider.vehicle, null)
      assert.deepStrictEqual(vehicle.passengers, [])
    }
  })

  it('allows resource-pack handlers to decline configuration packs without a later acceptance', () => {
    const bot = makeBot('26.3')
    bot._client.state = 'configuration'
    require('../lib/plugins/resource_pack')(bot)
    const uuid = '00000000-0000-4000-8000-000000000001'
    bot.on('resourcePack', (url, id) => {
      assert.strictEqual(url, 'https://example.com/pack.zip')
      assert.strictEqual(id, uuid)
      bot.denyResourcePack()
    })
    bot._client.emit('add_resource_pack', { uuid, url: 'https://example.com/pack.zip' })
    bot.acceptResourcePack()
    assert.deepStrictEqual(bot.packets, [{ name: 'resource_pack_receive', params: { uuid, result: 1 } }])
  })

  it('acknowledges an unhandled configuration pack once in protocol order', () => {
    const bot = makeBot('26.3')
    bot._client.state = 'configuration'
    require('../lib/plugins/resource_pack')(bot)
    const uuid = '00000000-0000-4000-8000-000000000001'
    bot._client.emit('add_resource_pack', { uuid, url: 'https://example.com/pack.zip' })
    bot.acceptResourcePack()
    assert.deepStrictEqual(bot.packets.map(packet => packet.params), [3, 4, 0].map(result => ({ uuid, result })))
  })

  it('decodes modern velocity in blocks per tick and legacy fixed-point velocity', () => {
    for (const version of ['1.8.8', '1.21.8', '1.21.9', '26.3']) {
      const bot = makeBot(version)
      require('../lib/plugins/entities')(bot)
      const scale = bot.supportFeature('entityVelocityIsLpVec3') ? 1 : 8000
      bot._client.emit('entity_velocity', { entityId: 2, velocity: { x: scale, y: -scale / 2, z: 0 } })
      assert.strictEqual(bot.entities[2].velocity.x, 1, version)
      assert.strictEqual(bot.entities[2].velocity.y, -0.5, version)
    }
  })

  it('acknowledges empty chunk batches without poisoning subsequent throughput estimates', () => {
    const bot = makeBot()
    require('../lib/plugins/blocks')(bot, { version: bot.version })
    bot._client.emit('chunk_batch_start', {})
    bot._client.emit('chunk_batch_finished', { batchSize: 0 })
    assert.strictEqual(bot.packets.at(-1).params.chunksPerTick, 3.5)
    bot._client.emit('chunk_batch_start', {})
    bot._client.emit('chunk_batch_finished', { batchSize: 1 })
    assert.ok(Number.isFinite(bot.packets.at(-1).params.chunksPerTick))
    assert.ok(bot.packets.at(-1).params.chunksPerTick > 0)
  })

  it('reads both mapped and numeric difficulty, including peaceful', () => {
    const bot = makeBot()
    require('../lib/plugins/game')(bot, { brand: 'test' })
    for (const [difficulty, expected] of [[0, 'peaceful'], [3, 'hard'], ['normal', 'normal']]) {
      bot._client.emit('difficulty', { difficulty })
      assert.strictEqual(bot.game.difficulty, expected)
    }
  })

  it('retains the alive state across dimension changes and emits the next spawn once', () => {
    for (const [copyMetadata, alive] of [[true, true], [false, false], [0, false], [1, false], [2, true], [3, true]]) {
      const bot = makeBot()
      require('../lib/plugins/health')(bot, { respawn: false })
      bot._client.emit('update_health', { health: 20, food: 20, foodSaturation: 5 })
      let spawns = 0
      bot.on('spawn', () => spawns++)
      bot._client.emit('respawn', { copyMetadata })
      assert.strictEqual(bot.isAlive, alive, `copyMetadata=${copyMetadata}`)
      bot._client.emit('update_health', { health: 20, food: 20, foodSaturation: 5 })
      bot._client.emit('update_health', { health: 20, food: 20, foodSaturation: 5 })
      assert.strictEqual(spawns, 1)
    }
  })

  it('sets and removes modern scores without changing the public string title', () => {
    const bot = makeBot()
    bot.teamMap = {}
    require('../lib/plugins/scoreboard')(bot)
    for (const name of ['one', 'two']) {
      bot._client.emit('scoreboard_objective', { name, action: 0, displayText: '{"text":"A","extra":[{"text":"B"}]}' })
      assert.strictEqual(bot.scoreboards[name].title, 'AB')
      bot._client.emit('scoreboard_score', { scoreName: name, itemName: 'player', value: 12 })
      assert.strictEqual(bot.scoreboards[name].itemsMap.player.value, 12)
    }
    bot._client.emit('reset_score', { objective_name: 'missing', entity_name: 'player' })
    assert.strictEqual(bot.scoreboards.one.itemsMap.player.value, 12)
    bot._client.emit('reset_score', { entity_name: 'player' })
    assert.deepStrictEqual(bot.scoreboards.one.items, [])
    assert.deepStrictEqual(bot.scoreboards.two.items, [])
  })

  function creativeBot () {
    const bot = makeBot('1.21.3')
    const Item = require('prismarine-item')(bot.registry)
    bot.inventory = new EventEmitter()
    bot.inventory.slots = new Array(46).fill(null)
    bot._setSlot = (slot, item) => {
      const old = bot.inventory.slots[slot]
      bot.inventory.slots[slot] = item
      bot.inventory.emit(`updateSlot:${slot}`, old, item)
    }
    require('../lib/plugins/creative')(bot)
    return { bot, Item }
  }

  it('releases a creative slot lock when no wait is requested or sending throws', async () => {
    const { bot, Item } = creativeBot()
    const item = new Item(bot.registry.itemsByName.stone.id, 1)
    await bot.creative.setInventorySlot(36, item, 0)
    await bot.creative.setInventorySlot(36, null, 0)
    const write = bot._client.write
    bot._client.write = () => { throw new Error('send failed') }
    await assert.rejects(bot.creative.setInventorySlot(36, item, 0), /send failed/)
    bot._client.write = write
    await bot.creative.setInventorySlot(36, item, 0)
  })

  it('rejects creative slot corrections including null and different item types', async () => {
    for (const correction of ['null', 'other', 'count']) {
      const { bot, Item } = creativeBot()
      const item = new Item(bot.registry.itemsByName.stone.id, 1)
      const pending = bot.creative.setInventorySlot(36, item)
      const rejected = assert.rejects(pending, /Server rejected/)
      const corrected = correction === 'null'
        ? null
        : new Item(
          bot.registry.itemsByName[correction === 'other' ? 'dirt' : 'stone'].id,
          correction === 'count' ? 2 : 1)
      assert.doesNotThrow(() => bot._setSlot(36, corrected))
      await rejected
      assert.strictEqual(bot.inventory.listenerCount('updateSlot:36'), 0)
      bot._client.emit('statistics', {})
    }
  })

  it('keeps watching for rejection after a matching creative slot echo', async () => {
    const { bot, Item } = creativeBot()
    const item = new Item(bot.registry.itemsByName.stone.id, 1)
    const pending = bot.creative.setInventorySlot(36, item)
    const rejected = assert.rejects(pending, /Server rejected/)
    bot._setSlot(36, item)
    bot._setSlot(36, null)
    await rejected
    bot._client.emit('statistics', {})
  })

  it('clears timeout handles after success, rejection, and abort', async () => {
    const set = global.setTimeout
    const clear = global.clearTimeout
    const active = new Set()
    global.setTimeout = (callback, ms, ...args) => {
      const handle = set(callback, ms, ...args)
      active.add(handle)
      return handle
    }
    global.clearTimeout = handle => { active.delete(handle); clear(handle) }
    try {
      const emitter = new EventEmitter()
      const success = onceWithCleanup(emitter, 'ready', { timeout: 60000 })
      emitter.emit('ready', 12)
      assert.deepStrictEqual(await success, [12])
      const controller = new AbortController()
      const aborted = onceWithCleanup(emitter, 'ready', { timeout: 60000, signal: controller.signal })
      controller.abort(new Error('cancelled'))
      await assert.rejects(aborted, /cancelled/)
      assert.strictEqual(await withTimeout(Promise.resolve(42), 60000), 42)
      await assert.rejects(withTimeout(Promise.reject(new Error('failed')), 60000), /failed/)
      await new Promise(resolve => setImmediate(resolve))
      assert.strictEqual(emitter.listenerCount('ready'), 0)
      assert.strictEqual(active.size, 0)
    } finally {
      for (const handle of active) clear(handle)
      global.setTimeout = set
      global.clearTimeout = clear
    }
  })
})
