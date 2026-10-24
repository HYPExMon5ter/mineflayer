const net = require('net')

// A TCP proxy that delivers everything a fixed time after it was received, in both directions and
// in order, like a connection with that one-way latency. The vanilla suites run through it when
// MC_LATENCY_MS is set, so they also check that nothing depends on the server answering at once.
function startLatencyProxy ({ targetPort, targetHost = '127.0.0.1', latencyMs }) {
  const sockets = new Set()
  const server = net.createServer(client => {
    const upstream = net.connect(targetPort, targetHost)
    for (const socket of [client, upstream]) {
      sockets.add(socket)
      socket.setNoDelay(true)
      socket.on('close', () => sockets.delete(socket))
      socket.on('error', () => {})
    }
    delay(client, upstream, latencyMs)
    delay(upstream, client, latencyMs)
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve({
      port: server.address().port,
      close () {
        for (const socket of sockets) socket.destroy()
        return new Promise(resolve => server.close(resolve))
      }
    }))
  })
}

// Every chunk waits latencyMs from its arrival; timers of equal delay fire in the order they were
// set, so the stream stays in order. An end or close is passed on after the data before it.
function delay (from, to, latencyMs) {
  from.on('data', chunk => setTimeout(() => { if (!to.destroyed) to.write(chunk) }, latencyMs))
  from.on('end', () => setTimeout(() => to.end(), latencyMs))
  from.on('close', () => setTimeout(() => to.destroy(), latencyMs))
}

module.exports = { startLatencyProxy }
