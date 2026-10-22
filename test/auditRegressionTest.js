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
    // Vanilla ignores clicks for any other container while this one is open server-side.
    assert.deepStrictEqual(bot.packets, [{ name: 'close_window', params: { windowId: 8 } }])
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

  it('reports leaving the previous vehicle when the new vehicle passengers arrive first', () => {
    const bot = makeBot('26.3')
    require('../lib/plugins/entities')(bot)
    bot._client.emit('login', { entityId: 0 })
    for (const id of [2, 3, 4]) bot._client.emit('entity_velocity', { entityId: id, velocity: { x: 0, y: 0, z: 0 } })
    const [a, b, rider] = [bot.entities[2], bot.entities[3], bot.entities[4]]
    bot._client.emit('set_passengers', { entityId: 2, passengers: [0, 4] })
    const events = []
    bot.on('dismount', vehicle => events.push(['dismount', vehicle.id, bot.vehicle?.id]))
    bot.on('mount', () => events.push(['mount', bot.vehicle.id]))
    bot.on('entityDetach', (entity, vehicle) => events.push(['detach', entity.id, vehicle.id, entity.vehicle?.id]))
    bot.on('entityAttach', (entity, vehicle) => events.push(['attach', entity.id, vehicle.id]))
    bot._client.emit('set_passengers', { entityId: 3, passengers: [0, 4] })
    bot._client.emit('set_passengers', { entityId: 2, passengers: [] })
    // Relationships are settled before any event, so listeners already see the new vehicle.
    assert.deepStrictEqual(events, [['dismount', 2, 3], ['detach', 4, 2, 3], ['mount', 3], ['attach', 4, 3]])
    assert.deepStrictEqual(a.passengers, [])
    assert.deepStrictEqual(b.passengers, [bot.entity, rider])
    assert.strictEqual(bot.vehicle, b)
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

  it('does not let listeners that leave a configuration pack unanswered stall the transfer', () => {
    for (const version of ['1.20.2', '26.3']) {
      const bot = makeBot(version)
      bot._client.state = 'configuration'
      require('../lib/plugins/resource_pack')(bot)
      const seen = []
      bot.on('resourcePack', (url, id) => seen.push([url, id]))
      const packet = { uuid: '00000000-0000-4000-8000-000000000002', url: 'https://example.com/a.zip', hash: 'abc' }
      bot._client.emit(bot.supportFeature('resourcePackUsesUUID') ? 'add_resource_pack' : 'resource_pack_send', packet)
      const expectedId = bot.supportFeature('resourcePackUsesUUID') ? packet.uuid : packet.hash
      assert.deepStrictEqual(seen, [[packet.url, expectedId]], version)
      assert.deepStrictEqual(bot.packets.map(p => p.params.result), version === '26.3' ? [3, 4, 0] : [3, 0], version)
      bot.denyResourcePack()
      assert.strictEqual(bot.packets.length, version === '26.3' ? 3 : 2, version)
    }
  })

  it('answers each outstanding 1.20.3+ pack by id, URL or recency', () => {
    const bot = makeBot('26.3')
    bot._client.state = 'play'
    require('../lib/plugins/resource_pack')(bot)
    const packs = [1, 2, 3, 4].map(n => ({ uuid: `00000000-0000-4000-8000-00000000000${n}`, url: `https://example.com/${n}.zip` }))
    for (const pack of packs) bot._client.emit('add_resource_pack', pack)
    assert.deepStrictEqual(bot.packets, [])
    bot.denyResourcePack(packs[0].uuid)
    bot.acceptResourcePack(packs[1].url)
    bot._client.emit('remove_resource_pack', { uuid: packs[2].uuid })
    bot.acceptResourcePack(packs[2].uuid)
    bot.acceptResourcePack()
    bot.acceptResourcePack()
    bot.denyResourcePack(packs[0].uuid)
    assert.deepStrictEqual(bot.packets.map(p => p.params), [
      { uuid: packs[0].uuid, result: 1 },
      ...[3, 4, 0].map(result => ({ uuid: packs[1].uuid, result })),
      ...[3, 4, 0].map(result => ({ uuid: packs[3].uuid, result }))
    ])
  })

  it('answers a request when acceptResourcePack is used directly as the listener', () => {
    const bot = makeBot('26.3')
    require('../lib/plugins/resource_pack')(bot)
    bot.on('resourcePack', bot.acceptResourcePack)
    const uuid = '00000000-0000-4000-8000-000000000009'
    bot._client.emit('add_resource_pack', { uuid, url: 'https://example.com/pack.zip' })
    assert.deepStrictEqual(bot.packets.map(p => p.params), [3, 4, 0].map(result => ({ uuid, result })))
  })

  it('answers legacy hash-based requests with the hash only where the protocol has it', () => {
    for (const [version, withHash] of [['1.8.8', true], ['1.12.2', false]]) {
      const bot = makeBot(version)
      require('../lib/plugins/resource_pack')(bot)
      bot._client.emit('resource_pack_send', { url: 'https://example.com/old.zip', hash: 'old' })
      bot._client.emit('resource_pack_send', { url: 'https://example.com/new.zip', hash: 'new' })
      bot.acceptResourcePack('old')
      assert.deepStrictEqual(bot.packets, [], version)
      bot.denyResourcePack()
      bot.acceptResourcePack()
      assert.deepStrictEqual(bot.packets.map(p => p.params), [withHash ? { result: 1, hash: 'new' } : { result: 1 }], version)
    }
  })

  it('resolves 1.21.2+ teleports like vanilla PositionMoveRotation.calculateAbsolute', () => {
    const { resolveRelativeTeleport } = require('../lib/teleport')
    const { Vec3 } = require('vec3')
    const current = { position: new Vec3(1, 2, 3), velocity: new Vec3(1, 0.5, 0), yaw: 0, pitch: 0 }
    const packet = (values, flags = {}) => ({ x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0, yaw: 0, pitch: 0, ...values, flags })
    const absolute = resolveRelativeTeleport(current, packet({ x: 5, dx: 0.25, dy: -0.5, yaw: 45, pitch: 120 }))
    assert.deepStrictEqual(absolute, { position: new Vec3(5, 0, 0), velocity: new Vec3(0.25, -0.5, 0), yaw: 45, pitch: 90 })
    const relative = resolveRelativeTeleport(current, packet({ x: 1, dy: 0.25, pitch: -100 }, { x: true, y: true, dx: true, dy: true, pitch: true }))
    assert.deepStrictEqual(relative, { position: new Vec3(2, 2, 0), velocity: new Vec3(1, 0.75, 0), yaw: 0, pitch: -90 })
    // Turning 90 degrees with yawDelta rotates the kept velocity from +X towards +Z.
    const turned = resolveRelativeTeleport(current, packet({ yaw: 90 }, { yawDelta: true, dx: true, dy: true, dz: true }))
    assert.ok(Math.abs(turned.velocity.x) < 1e-9 && Math.abs(turned.velocity.z - 1) < 1e-9, `${turned.velocity}`)
    assert.strictEqual(turned.velocity.y, 0.5)
    assert.strictEqual(current.velocity.x, 1, 'the current state is not modified')
  })

  it('emits entitySwingArm for 26.3 swing_animation packets and keeps renumbered animations', () => {
    const swings = []
    const effects = []
    for (const version of ['1.8.8', '1.21.11', '26.3']) {
      const bot = makeBot(version)
      require('../lib/plugins/entities')(bot)
      bot.on('entitySwingArm', entity => swings.push([version, entity.id]))
      for (const event of ['entityWake', 'entityCriticalEffect', 'entityMagicCriticalEffect']) {
        bot.on(event, entity => effects.push([version, event, entity.id]))
      }
      bot._client.emit('animation', { entityId: 5, animation: 0 })
      bot._client.emit('animation', { entityId: 5, animation: 4 })
      if (version === '26.3') {
        bot._client.emit('swing_animation', { entityId: 6, hand: 0, animationType: 1, duration: 6 })
        bot._client.emit('swing_animation', { entityId: 7, hand: 1, animationType: 1, duration: 6 })
        bot._client.emit('animation', { entityId: 5, animation: 1 })
      }
    }
    assert.deepStrictEqual(swings, [['1.8.8', 5], ['1.21.11', 5], ['26.3', 6]])
    assert.deepStrictEqual(effects, [
      ['1.8.8', 'entityCriticalEffect', 5],
      ['1.21.11', 'entityCriticalEffect', 5],
      ['26.3', 'entityWake', 5],
      ['26.3', 'entityCriticalEffect', 5]
    ])
  })

  it('prices villager trades like vanilla, including discounts and demand', () => {
    const { tradePrice } = require('../lib/tradePrice')
    const f32 = Math.fround
    const offer = (demand, priceMultiplier, specialPrice) => ({ demand, priceMultiplier: f32(priceMultiplier), specialPrice })
    assert.strictEqual(tradePrice(2, 64, offer(0, 0.05, 0)), 2)
    // The former external fixture: demand 60 adds floor(2 * 60 * 0.05) = 6, a -4 discount removes 4.
    assert.strictEqual(tradePrice(2, 64, offer(60, 0.05, -4)), 4)
    assert.strictEqual(tradePrice(2, 64, offer(0, 0.05, -4)), 1, 'never below one item')
    assert.strictEqual(tradePrice(32, 64, offer(-10, 0.2, 0)), 32, 'negative demand never discounts')
    assert.strictEqual(tradePrice(36, 64, offer(100, 0.2, 0)), 64, 'clamped to the max stack size')
    assert.strictEqual(tradePrice(1, 16, offer(3, 0.1, 0)), 1)
    // Vanilla multiplies in float: 20 * 0.35f rounds to 7.0, while the double product is 6.9999998
    assert.strictEqual(tradePrice(2, 64, offer(10, 0.35, 0)), 9)
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

  it('announces spawn once per login, including a proxy switch without respawn', async () => {
    for (const version of ['1.8.8', '1.21.4', '26.3']) {
      const bot = makeBot(version)
      bot._client.state = 'play'
      bot.entity = { position: { x: 0, y: 64, z: 0 } }
      bot.blockAt = () => ({})
      require('../lib/plugins/health')(bot, { respawn: false })
      let spawns = 0
      bot.on('spawn', () => spawns++)
      const healthy = { health: 20, food: 20, foodSaturation: 5 }
      bot._client.emit('update_health', healthy)
      assert.strictEqual(spawns, 0, `${version}: no spawn before login`)
      for (let login = 1; login <= 2; login++) {
        // The game plugin emits login for every login packet
        bot.emit('login')
        bot._client.emit('update_health', healthy)
        bot._client.emit('update_health', healthy)
        assert.strictEqual(spawns, login, version)
      }
      const loaded = bot.packets.filter(packet => packet.name === 'player_loaded').length
      assert.strictEqual(loaded, bot.supportFeature('sendsPlayerLoadedPacket') ? 2 : 0, version)
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

  function creativeBot (version = '1.21.3') {
    const bot = makeBot(version)
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

  it('accepts a server echo of the creative item as it was sent', async () => {
    const { bot, Item } = creativeBot()
    const item = new Item(bot.registry.itemsByName.diamond_sword.id, 1)
    item.enchants = [{ name: 'sharpness', lvl: 2 }]
    const sent = () => bot.packets.findLast(packet => packet.name === 'set_creative_slot').params.item
    const pending = bot.creative.setInventorySlot(36, item)
    bot._setSlot(36, Item.fromNotch(sent()))
    bot._client.emit('statistics', {})
    await pending
  })

  it('sends 1.21.5+ creative item components as their encoded bytes', async () => {
    const mc = require('minecraft-protocol')
    for (const version of ['1.21.4', '1.21.5', '26.3']) {
      const { bot, Item } = creativeBot(version)
      bot._client.serializer = mc.createSerializer({ state: 'play', isServer: false, version })
      const book = new Item(bot.registry.itemsByName.enchanted_book.id, 1)
      book.enchants = [{ name: 'sharpness', lvl: 5 }]
      await bot.creative.setInventorySlot(36, book, 0)
      const params = bot.packets.findLast(packet => packet.name === 'set_creative_slot').params
      // What a vanilla server reads: the packet, then each component's bytes with its codec
      const buffer = bot._client.serializer.createPacketBuffer({ name: 'set_creative_slot', params })
      const read = mc.createDeserializer({ state: 'play', isServer: true, version }).parsePacketBuffer(buffer).data.params.item
      const proto = bot._client.serializer.proto
      const components = read.components.map(component => {
        if (!Buffer.isBuffer(component.data)) return component
        const type = Buffer.alloc(proto.sizeOf(component.type, 'SlotComponentType'))
        proto.write(component.type, type, 0, 'SlotComponentType')
        return proto.parsePacketBuffer('SlotComponent', Buffer.concat([type, component.data])).data
      })
      assert.strictEqual(Buffer.isBuffer(read.components[0].data), version !== '1.21.4', version)
      assert.deepStrictEqual(Item.fromNotch({ ...read, components }).enchants, [{ name: 'sharpness', lvl: 5 }], version)
    }
  })

  it('moves the given anvil items and takes the result only once the server sent it', async () => {
    const bot = makeBot('1.21.11')
    const Item = require('prismarine-item')(bot.registry)
    const windows = require('prismarine-windows')(bot.registry)
    const anvil = windows.createWindow(1, 'minecraft:anvil', 'Anvil')
    bot.inventory = windows.createWindow(0, 'minecraft:inventory', 'Inventory')
    bot.game = { gameMode: 'survival' }
    bot.experience = { level: 30 }
    const plain = new Item(bot.registry.itemsByName.diamond_sword.id, 1)
    const sword = new Item(bot.registry.itemsByName.diamond_sword.id, 1)
    sword.enchants = [{ name: 'sharpness', lvl: 1 }]
    const book = new Item(bot.registry.itemsByName.enchanted_book.id, 1)
    book.enchants = [{ name: 'unbreaking', lvl: 1 }]
    // An unenchanted sword first: 1.20.5+ items cannot be told apart by type and NBT
    for (const [slot, item] of [[30, plain], [31, sword], [32, book]]) anvil.updateSlot(slot, item)
    const actions = []
    bot.openBlock = async () => anvil
    bot.clickWindow = async slot => {
      actions.push(['click', slot])
      const held = anvil.selectedItem
      anvil.selectedItem = anvil.slots[slot]
      anvil.updateSlot(slot, held)
      // the server computes the output after the second input; it reaches the bot later
      if (slot === 1) setTimeout(() => anvil.updateSlot(2, new Item(sword.type, 1)), 20)
    }
    bot.putAway = async slot => {
      actions.push(['putAway', slot, anvil.slots[slot] !== null])
      bot.experience.level -= 2
      bot.emit('experience')
    }
    require('../lib/plugins/anvil')(bot)
    const opened = await bot.openAnvil({})
    await opened.combine(anvil.slots[31], anvil.slots[32])
    assert.deepStrictEqual(actions, [['click', 31], ['click', 0], ['click', 32], ['click', 1], ['putAway', 2, true]])
  })

  it('waits for the entity type each boat item spawns', async () => {
    const { Vec3 } = require('vec3')
    const cases = [['1.8.8', 'boat', 'Boat'], ['1.20.4', 'oak_chest_boat', 'chest_boat'], ['1.20.4', 'bamboo_raft', 'boat'], ['26.3', 'spruce_chest_boat', 'spruce_chest_boat'], ['26.3', 'bamboo_raft', 'bamboo_raft']]
    for (const [version, itemName, entityName] of cases) {
      const bot = makeBot(version)
      const Item = require('prismarine-item')(bot.registry)
      bot.heldItem = new Item(bot.registry.itemsByName[itemName].id, 1)
      bot.entity = { yaw: 0, pitch: 0 }
      bot._nextSequence = () => 0
      bot._genericPlace = async (block, face) => block.position
      require('../lib/plugins/place_entity')(bot)
      const placed = bot.placeEntity({ position: new Vec3(0, 64, 0) }, new Vec3(0, 1, 0))
      await new Promise(resolve => setImmediate(resolve))
      bot.emit('entitySpawn', { name: 'zombie', position: new Vec3(0.5, 65, 0.5) })
      bot.emit('entitySpawn', { name: entityName, position: new Vec3(0.5, 65, 0.5) })
      assert.strictEqual((await placed).name, entityName, `${version} ${itemName}`)
    }
  })

  it('restores gravity when the server ends the ability to fly', () => {
    const { bot } = creativeBot()
    bot.physics = { gravity: 0.08 }
    require('../lib/plugins/abilities')(bot)
    const abilities = flags => bot._client.emit('abilities', { flags, flyingSpeed: 0.05, walkingSpeed: 0.1 })
    abilities(4) // creative: may fly
    bot.creative.startFlying()
    abilities(4)
    assert.strictEqual(bot.physics.gravity, 0)
    abilities(0) // survival
    assert.strictEqual(bot.physics.gravity, 0.08)
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
