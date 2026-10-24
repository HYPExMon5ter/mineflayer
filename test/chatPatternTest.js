/* global describe, it */
const assert = require('assert')
const { EventEmitter } = require('events')
const registry = require('prismarine-registry')('1.20.4')
const injectChat = require('../lib/plugins/chat')

function createBot () {
  const bot = new EventEmitter()
  bot.registry = registry
  bot.supportFeature = () => false
  bot.blockAtCursor = () => null
  bot._client = new EventEmitter()
  bot._client.chat = () => {}
  bot._client.write = () => {}
  return bot
}

describe('chat patterns', function () {
  it('continues checking other patterns when a pattern set is incomplete', function () {
    const bot = createBot()
    injectChat(bot, { defaultChatPatterns: false })

    bot.addChatPatternSet('sequence', [/hello/, /world/], { repeat: false })
    bot.addChatPattern('single', /hello/, { repeat: false })

    let singleMatches = null
    bot.on('chat:single', matches => {
      singleMatches = matches
    })

    bot.emit('messagestr', 'hello', 'chat', {})

    assert.deepStrictEqual(singleMatches, ['hello'])
  })

  it('skips patterns removed by a listener for an earlier pattern on the same message', function () {
    const bot = createBot()
    injectChat(bot, { defaultChatPatterns: false })
    const first = bot.addChatPattern('first', /hello/)
    bot.addChatPattern('second', /hello/)
    bot.addChatPattern('legacy', /(hello)/, { deprecated: true })
    const seen = []
    bot.on('chat:first', () => {
      seen.push('first')
      bot.removeChatPattern('second')
      bot.removeChatPattern('legacy')
    })
    bot.on('chat:second', () => seen.push('second'))
    bot.on('legacy', () => seen.push('legacy'))
    assert.doesNotThrow(() => bot.emit('messagestr', 'hello', 'chat', {}))
    assert.deepStrictEqual(seen, ['first'])
    bot.removeChatPattern(first)
    assert.doesNotThrow(() => bot.emit('messagestr', 'hello', 'chat', {}))
    assert.deepStrictEqual(seen, ['first'])
  })

  it('lets a listener remove its own repeating or deprecated pattern', function () {
    const bot = createBot()
    injectChat(bot, { defaultChatPatterns: false })
    let count = 0
    bot.addChatPattern('own', /ping/)
    bot.addChatPattern('legacyOwn', /(ping)/, { deprecated: true })
    bot.on('chat:own', () => { count++; bot.removeChatPattern('own') })
    bot.on('legacyOwn', () => { count++; bot.removeChatPattern('legacyOwn') })
    assert.doesNotThrow(() => bot.emit('messagestr', 'ping', 'chat', {}))
    bot.emit('messagestr', 'ping', 'chat', {})
    assert.strictEqual(count, 2)
  })
})
