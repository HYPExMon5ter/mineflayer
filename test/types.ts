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
