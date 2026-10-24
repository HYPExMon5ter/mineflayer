/* eslint-env mocha */

const assert = require('assert')
const { EventEmitter } = require('events')
const injectScoreboard = require('../lib/plugins/scoreboard')

function makeBot (version = '1.20.4') {
  const bot = new EventEmitter()
  bot._client = new EventEmitter()
  bot.registry = require('prismarine-registry')(version)
  bot.teamMap = {}
  injectScoreboard(bot)
  return bot
}

function createScoreboard (bot, name = 'objective') {
  bot._client.emit('scoreboard_objective', {
    name,
    action: 0,
    displayText: JSON.stringify({ text: name })
  })
  return bot.scoreboards[name]
}

describe('scoreboard display cleanup', () => {
  it('removes a deleted objective from every display slot', () => {
    const bot = makeBot()
    const scoreboard = createScoreboard(bot)

    bot._client.emit('scoreboard_display_objective', { name: scoreboard.name, position: 0 })
    bot._client.emit('scoreboard_display_objective', { name: scoreboard.name, position: 1 })

    assert.strictEqual(bot.scoreboard.list, scoreboard)
    assert.strictEqual(bot.scoreboard.sidebar, scoreboard)

    bot._client.emit('scoreboard_objective', { name: scoreboard.name, action: 1 })

    assert.strictEqual(bot.scoreboard.list, undefined)
    assert.strictEqual(bot.scoreboard.sidebar, undefined)
  })

  it('clears a display slot when the server sends an empty objective name', () => {
    const bot = makeBot()
    const scoreboard = createScoreboard(bot)
    const positions = []
    const cleared = []
    bot.on('scoreboardPosition', (...args) => positions.push(args))
    bot.on('scoreboardPositionCleared', (...args) => cleared.push(args))

    bot._client.emit('scoreboard_display_objective', { name: scoreboard.name, position: 1 })
    bot._client.emit('scoreboard_display_objective', { name: '', position: 1 })
    bot._client.emit('scoreboard_display_objective', { name: '', position: 1 })

    assert.strictEqual(bot.scoreboard.sidebar, undefined)
    // scoreboardPosition keeps its non-null scoreboard argument; clears have their own event.
    assert.deepStrictEqual(positions, [[1, scoreboard, undefined]])
    assert.deepStrictEqual(cleared, [[1, scoreboard]])
  })

  it('reports display slots vacated by a deleted objective', () => {
    const bot = makeBot()
    const scoreboard = createScoreboard(bot)
    const cleared = []
    bot.on('scoreboardPositionCleared', (...args) => cleared.push(args))
    bot._client.emit('scoreboard_display_objective', { name: scoreboard.name, position: 0 })
    bot._client.emit('scoreboard_display_objective', { name: scoreboard.name, position: 2 })
    bot._client.emit('scoreboard_objective', { name: scoreboard.name, action: 1 })
    assert.deepStrictEqual(cleared, [[0, scoreboard], [2, scoreboard]])
  })
})

describe('scoreboard titles', () => {
  it('keeps legacy formatting codes in plain-string titles', () => {
    for (const version of ['1.8.8', '1.12.2']) {
      const bot = makeBot(version)
      for (const displayText of ['§aKills §lnow', 'not {json', '123', 'null']) {
        bot._client.emit('scoreboard_objective', { name: 'legacy', action: 0, displayText })
        assert.strictEqual(bot.scoreboards.legacy.title, displayText, version)
      }
      // As before, a JSON component is read as text on every version.
      bot._client.emit('scoreboard_objective', { name: 'legacy', action: 0, displayText: '{"text":"Test 1"}' })
      assert.strictEqual(bot.scoreboards.legacy.title, 'Test 1', version)
      bot._client.emit('scoreboard_objective', { name: 'legacy', action: 2, displayText: '§cRenamed' })
      assert.strictEqual(bot.scoreboards.legacy.title, '§cRenamed', version)
    }
  })

  it('reads JSON and NBT chat-component titles as plain text', () => {
    const bot = makeBot('1.13.2')
    bot._client.emit('scoreboard_objective', { name: 'json', action: 0, displayText: '{"text":"A","color":"red","extra":[{"text":"B"}]}' })
    assert.strictEqual(bot.scoreboards.json.title, 'AB')

    const nbtBot = makeBot('1.20.4')
    const displayText = { type: 'compound', value: { text: { type: 'string', value: 'Kills' }, color: { type: 'string', value: 'green' } } }
    nbtBot._client.emit('scoreboard_objective', { name: 'nbt', action: 0, displayText })
    assert.strictEqual(nbtBot.scoreboards.nbt.title, 'Kills')
  })
})
