const entityActions = {
  start_sneaking: [0],
  stop_sneaking: [1],
  stop_sleeping: [2, 'leave_bed'],
  start_sprinting: [3],
  stop_sprinting: [4],
  start_riding_jump: [5, 'start_horse_jump'],
  stop_riding_jump: [6, 'stop_horse_jump'],
  open_inventory: [7, 'open_vehicle_inventory'],
  start_fall_flying: [8, 'start_elytra_flying']
}

function enumValue (bot, packet, field, name, legacyId, aliases = []) {
  const fields = bot.registry.protocol?.play?.toServer?.types[`packet_${packet}`]?.[1]
  const type = fields?.find(entry => entry.name === field)?.type
  if (Array.isArray(type) && type[0] === 'mapper') {
    const names = Object.values(type[1].mappings)
    const value = [name, ...aliases].find(candidate => names.includes(candidate))
    if (!value) throw new Error(`${packet}.${field} does not support ${name}`)
    return value
  }
  return legacyId
}

function entityAction (bot, name) {
  const [legacyId, ...aliases] = entityActions[name]
  return enumValue(bot, 'entity_action', 'actionId', name, legacyId, aliases)
}

function clientCommand (bot, name) {
  const id = { perform_respawn: 0, request_stats: 1 }[name]
  if (bot.supportFeature('respawnIsPayload')) return { payload: id }
  return { actionId: enumValue(bot, 'client_command', 'actionId', name, id) }
}

module.exports = { entityAction, clientCommand }
