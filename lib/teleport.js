const { Vec3 } = require('vec3')

module.exports = { resolveRelativeTeleport }

// 1.21.2+ position and entity_teleport packets, as resolved by vanilla
// PositionMoveRotation.calculateAbsolute. Each position, rotation and velocity component is
// absolute, or relative to the current value when its flag is set; yawDelta first turns the
// current velocity by the rotation change. Angles are Notchian degrees, velocity is in
// blocks per tick.
function resolveRelativeTeleport ({ position, velocity, yaw, pitch }, packet) {
  const { flags } = packet
  const newYaw = (flags.yaw ? yaw : 0) + packet.yaw
  const newPitch = Math.max(-90, Math.min(90, (flags.pitch ? pitch : 0) + packet.pitch))
  const current = flags.yawDelta
    ? rotate(velocity, toRadians(pitch - newPitch), toRadians(yaw - newYaw))
    : velocity
  return {
    position: new Vec3(
      (flags.x ? position.x : 0) + packet.x,
      (flags.y ? position.y : 0) + packet.y,
      (flags.z ? position.z : 0) + packet.z
    ),
    velocity: new Vec3(
      (flags.dx ? current.x : 0) + packet.dx,
      (flags.dy ? current.y : 0) + packet.dy,
      (flags.dz ? current.z : 0) + packet.dz
    ),
    yaw: newYaw,
    pitch: newPitch
  }
}

function toRadians (degrees) {
  return degrees * Math.PI / 180
}

// Vanilla Vec3.xRot then Vec3.yRot, angles in radians.
function rotate (v, pitchDelta, yawDelta) {
  const cp = Math.cos(pitchDelta)
  const sp = Math.sin(pitchDelta)
  const y = v.y * cp + v.z * sp
  const z = v.z * cp - v.y * sp
  const cy = Math.cos(yawDelta)
  const sy = Math.sin(yawDelta)
  return new Vec3(v.x * cy + z * sy, y, z * cy - v.x * sy)
}
