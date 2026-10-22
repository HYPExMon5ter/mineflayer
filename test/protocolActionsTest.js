/* eslint-env mocha */
const assert = require('assert')
const { createSerializer } = require('minecraft-protocol')
const { entityAction, clientCommand } = require('../lib/protocolActions')
const { testedVersions } = require('../lib/version')

describe('action packet wire compatibility', function () {
  this.timeout(10000)
  for (const version of testedVersions) {
    it(`serializes the actual action IDs on ${version}`, () => {
      const registry = require('prismarine-registry')(version)
      const bot = { registry, supportFeature: registry.supportFeature }
      const serializer = createSerializer({ state: 'play', version, isServer: false })
      const modern = registry.version['>=']('1.21.6')
      const actions = [['stop_sleeping', modern ? 0 : 2], ['start_sprinting', modern ? 1 : 3], ['stop_sprinting', modern ? 2 : 4]]
      if (!modern) actions.push(['start_sneaking', 0], ['stop_sneaking', 1])
      if (registry.version['>=']('1.9')) actions.push(['start_fall_flying', modern ? 6 : 8])
      for (const [name, expected] of actions) {
        const bytes = serializer.createPacketBuffer({ name: 'entity_action', params: { entityId: 0, actionId: entityAction(bot, name), jumpBoost: 0 } })
        assert.strictEqual(bytes.at(-2), expected, name)
      }
      for (const [name, expected] of [['perform_respawn', 0], ['request_stats', 1]]) {
        const bytes = serializer.createPacketBuffer({ name: 'client_command', params: clientCommand(bot, name) })
        assert.strictEqual(bytes.at(-1), expected, name)
      }
    })
  }
})
