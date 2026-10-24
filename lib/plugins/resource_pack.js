module.exports = inject

function inject (bot) {
  const TEXTURE_PACK_RESULTS = {
    SUCCESSFULLY_LOADED: 0,
    DECLINED: 1,
    FAILED_DOWNLOAD: 2,
    ACCEPTED: 3,
    // 1.20.3+
    DOWNLOADED: 4,
    INVALID_URL: 5,
    FAILED_RELOAD: 6,
    DISCARDED: 7
  }
  const usesUUID = bot.supportFeature('resourcePackUsesUUID')
  const usesHash = bot.supportFeature('resourcePackUsesHash')

  // Unanswered requests in arrival order, keyed by the id passed to the resourcePack event: the
  // pack UUID on 1.20.3+, the hash before. Older versions only ever have one request outstanding.
  // UUIDs must stay the wire UUID string: a uuid-1345 object serializes to 16 zero bytes.
  const pending = new Map()
  let latestId

  function request (url, id, uuid, hash) {
    if (!usesUUID) pending.clear()
    pending.delete(id)
    pending.set(id, { url, uuid, hash })
    latestId = id
    bot.emit('resourcePack', url, id)
    // The server holds the configuration phase (e.g. a Velocity server transfer) open until
    // the pack is answered. A listener may decide synchronously; otherwise accept so login
    // or the transfer can complete, as before listener ownership existed.
    if (bot._client.state === 'configuration') acceptResourcePack(id)
  }

  bot._client.on('add_resource_pack', (data) => request(data.url, data.uuid, data.uuid, data.hash))

  bot._client.on('resource_pack_send', (data) => {
    if (usesUUID) request(data.url, data.uuid, data.uuid, data.hash)
    else request(data.url, data.hash, undefined, data.hash)
  })

  // A removed pack no longer expects an answer; without a uuid every pack is removed.
  bot._client.on('remove_resource_pack', (data) => {
    if (data.uuid === undefined) pending.clear()
    else pending.delete(data.uuid)
  })

  // Answers the latest request by default. A request can also be selected by its id or URL;
  // the URL also makes `bot.on('resourcePack', bot.acceptResourcePack)` answer its own request.
  function take (idOrUrl) {
    let id = idOrUrl === undefined ? latestId : idOrUrl
    if (!pending.has(id)) {
      id = [...pending].reverse().find(([, pack]) => pack.url === idOrUrl)?.[0]
    }
    const pack = pending.get(id)
    pending.delete(id)
    return pack
  }

  function sendResourcePackResult (pack, result) {
    const packet = { result }
    if (usesHash) packet.hash = pack.hash
    else if (usesUUID) packet.uuid = pack.uuid
    bot._client.write('resource_pack_receive', packet)
  }

  // Results must be sent in the order ACCEPTED, DOWNLOADED (1.20.3+), SUCCESSFULLY_LOADED
  function acceptResourcePack (id) {
    const pack = take(id)
    if (pack === undefined) return
    sendResourcePackResult(pack, TEXTURE_PACK_RESULTS.ACCEPTED)
    if (usesUUID) sendResourcePackResult(pack, TEXTURE_PACK_RESULTS.DOWNLOADED)
    sendResourcePackResult(pack, TEXTURE_PACK_RESULTS.SUCCESSFULLY_LOADED)
  }

  function denyResourcePack (id) {
    const pack = take(id)
    if (pack === undefined) return
    sendResourcePackResult(pack, TEXTURE_PACK_RESULTS.DECLINED)
  }

  bot.acceptResourcePack = acceptResourcePack
  bot.denyResourcePack = denyResourcePack
}
