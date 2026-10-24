const sortItems = (a, b) => {
  if (a.value > b.value) return -1
  if (a.value < b.value) return 1
  return 0
}

module.exports = (bot) => {
  const ChatMessage = require('prismarine-chat')(bot.registry)

  // Titles are JSON chat components on 1.13-1.20.2 and NBT ones on 1.20.3+. Before 1.13 they
  // are plain strings whose § formatting codes are part of the title, so only genuine JSON
  // components are converted to text.
  function titleText (title) {
    if (typeof title !== 'string') return ChatMessage.fromNotch(title).toString()
    let component
    try {
      component = JSON.parse(title)
    } catch {
      return title
    }
    if (typeof component !== 'object' || component === null) return title
    return new ChatMessage(component).toString()
  }

  class ScoreBoard {
    constructor (packet) {
      this.name = packet.name
      this.setTitle(packet.displayText)
      this.itemsMap = {}
    }

    setTitle (title) {
      this.title = titleText(title)
    }

    add (name, value, display) {
      const displayed = display == null ? null : ChatMessage.fromNotch(display)
      this.itemsMap[name] = {
        name,
        value,
        get displayName () {
          if (displayed !== null) return displayed
          if (name in bot.teamMap) {
            return bot.teamMap[name].displayName(name)
          }
          return new ChatMessage(name)
        }
      }
      return this.itemsMap[name]
    }

    remove (name) {
      const removed = this.itemsMap[name]
      delete this.itemsMap[name]
      return removed
    }

    get items () {
      return Object.values(this.itemsMap).sort(sortItems)
    }
  }

  // The named slots alias the numeric ones and stay non-enumerable, so
  // Object.keys/values(bot.scoreboard) only ever yield displayed objectives.
  ScoreBoard.positions = Object.defineProperties({}, {
    list: { get () { return this[0] } },
    sidebar: { get () { return this[1] } },
    belowName: { get () { return this[2] } }
  })
  return ScoreBoard
}
