import { createBot, Particle } from '../index'
import { Vec3 } from 'vec3'

const bot = createBot({ host: 'localhost', username: 'typecheck', version: '26.3' })
bot.on('unknownWindow', packet => {
  const id: number = packet.windowId
  const type: number | string = packet.inventoryType
  console.log(id, type, packet.windowTitle)
})
bot.on('particle', particle => {
  const speed: Vec3 = particle.maxSpeed
  const mode: Particle['randomizationType'] = particle.randomizationType
  console.log(speed, mode, particle.movementSpeed)
})
bot.closeWindow(null)

bot.on('scoreboardPosition', (position, scoreboard, previous) => {
  const name: string = scoreboard.name
  console.log(position, name, previous?.name)
})
bot.on('scoreboardPositionCleared', (position, previous) => {
  const name: string = previous.name
  console.log(position, name)
})

bot.on('resourcePack', (url, hashOrUuid) => {
  const id: string = hashOrUuid
  if (url.endsWith('.zip')) bot.acceptResourcePack(id)
  else bot.denyResourcePack(url)
})
// Listeners written for the old declaration, which named a third parameter, still compile.
bot.on('resourcePack', (url, hash, uuid) => console.log(url, hash, uuid))
bot.on('resourcePack', bot.acceptResourcePack)
bot.acceptResourcePack()

const alive: boolean = bot.isAlive
const overworld = bot.time.clocks.overworld
if (overworld !== undefined) {
  const ticks: number = overworld.totalTicks + overworld.partialTick * overworld.rate
  console.log(alive, ticks, overworld.id)
}
