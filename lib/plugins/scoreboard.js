module.exports = inject

function inject (bot) {
  const ScoreBoard = require('../scoreboard')(bot)
  const scoreboards = {}

  bot._client.on('scoreboard_objective', (packet) => {
    if (packet.action === 0) {
      const { name } = packet
      const scoreboard = new ScoreBoard(packet)
      scoreboards[name] = scoreboard

      bot.emit('scoreboardCreated', scoreboard)
    }

    if (packet.action === 1) {
      bot.emit('scoreboardDeleted', scoreboards[packet.name])
      delete scoreboards[packet.name]

      for (const position of Object.keys(ScoreBoard.positions)) {
        const scoreboard = ScoreBoard.positions[position]
        if (scoreboard && scoreboard.name === packet.name) {
          delete ScoreBoard.positions[position]
          bot.emit('scoreboardPositionCleared', Number(position), scoreboard)
        }
      }
    }

    if (packet.action === 2) {
      if (!Object.hasOwn(scoreboards, packet.name)) {
        bot.emit('error', new Error(`Received update for unknown objective ${packet.name}`))
        return
      }
      scoreboards[packet.name].setTitle(packet.displayText)
      bot.emit('scoreboardTitleChanged', scoreboards[packet.name])
    }
  })

  function removeScore (objectiveName, itemName) {
    const objectives = objectiveName ? [scoreboards[objectiveName]] : Object.values(scoreboards)
    for (const scoreboard of objectives) {
      if (scoreboard && Object.hasOwn(scoreboard.itemsMap, itemName)) {
        const removed = scoreboard.remove(itemName)
        bot.emit('scoreRemoved', scoreboard, removed)
      }
    }
  }

  bot._client.on('scoreboard_score', (packet) => {
    if (packet.action === 1) return removeScore(packet.scoreName, packet.itemName)
    const scoreboard = scoreboards[packet.scoreName]
    if (scoreboard === undefined) return
    const updated = scoreboard.add(packet.itemName, packet.value, packet.display_name)
    bot.emit('scoreUpdated', scoreboard, updated)
  })

  bot._client.on('reset_score', (packet) => {
    removeScore(packet.objective_name, packet.entity_name)
  })

  bot._client.on('scoreboard_display_objective', (packet) => {
    const { name, position } = packet
    const previous = ScoreBoard.positions[position]

    if (name === '') {
      // A separate event keeps scoreboardPosition's scoreboard argument non-null for existing listeners.
      delete ScoreBoard.positions[position]
      if (previous !== undefined) bot.emit('scoreboardPositionCleared', position, previous)
      return
    }

    const scoreboard = scoreboards[name]
    if (scoreboard !== undefined) {
      bot.emit('scoreboardPosition', position, scoreboard, previous)
      ScoreBoard.positions[position] = scoreboard
    }
  })

  bot.scoreboards = scoreboards
  bot.scoreboard = ScoreBoard.positions

  // No objective or display slot survives a login; the dropped objectives emit no scoreboardDeleted and the objects stay the same.
  bot._client.on('login', () => {
    for (const name of Object.keys(scoreboards)) delete scoreboards[name]
    for (const position of Object.keys(ScoreBoard.positions)) {
      // The named slots are accessors over the numeric slots and must stay.
      if (Object.getOwnPropertyDescriptor(ScoreBoard.positions, position).get) continue
      delete ScoreBoard.positions[position]
    }
  })
}
