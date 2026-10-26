# Validation record

Executed locally on 2026-10-23 with Windows, Node.js 26.12.1 and Java 25 (OpenJDK 25.0.3). See [AUDIT.md](AUDIT.md) for scope, exclusions, dependency revisions and limitations. The [machine-readable record](validation-results.json) lists every attempt of this round, failed ones included, with its exit status and the SHA-256 of its log; the logs themselves are local and not published.

This record replaces the one for `a26a40f9` (the second follow-up), which is superseded, not rewritten; its text and record remain in the history of this file. It covers Mineflayer `912e8ca2` with the dependency revisions it pins (those in AUDIT.md, except minecraft-protocol `41e6cd2`), installed from the pinned published commits and the `java-26.3-data-9` release. Every Mineflayer log of this round's matrices ran that one commit from a separate clean worktree; companion logs each name their clean commit. The follow-up `ec5885d6`, which pins minecraft-protocol `005d953`, was checked with the targeted runs under [Follow-up at `ec5885d6`](#follow-up-at-ec5885d6), the spawn readiness fix `970eba23` with those under [Follow-up at `970eba23`](#follow-up-at-970eba23), the teleport confirmation fix with those under [Follow-up at `cb248a03`](#follow-up-at-cb248a03), the removal of dropped items between vanilla tests with those under [Follow-up at `ff4ad5b0`](#follow-up-at-ff4ad5b0), and the 1.8 dropped item metadata key, which pins the `java-26.3-data-10` release and the companion commits listed in AUDIT.md, with those under [Follow-up at `16fd831a`](#follow-up-at-16fd831a), the spawn terrain and deferred teleport reply fixes with those under [Follow-up at `8ffb2d8d`](#follow-up-at-8ffb2d8d), and the 26.3 sign text item components, which pin the `java-26.3-data-11` release, with those under [Follow-up at `7af17f87`](#follow-up-at-7af17f87).

## Evidence format

Every attempt runs into a new run directory and is never overwritten, so a rerun sits next to the attempt it repeats. Each Mineflayer log starts with a header naming `MC_VERSION`, the kind of run, the proxy latency, the commit, Node.js, Java and every installed companion archive or commit with its integrity, and ends with the process exit status; companion logs name their repository commit, the installed minecraft-data archive and the exit status. The generator (`write-validation.js`) refuses a run directory the manifest does not list, a log whose hash, exit status or counts differ from its record, any header whose dependencies differ from the evidence commit's `npm-shrinkwrap.json` (for a follow-up, from that commit's own shrinkwrap, which also gives the minecraft-data its companion logs and consumer check must name), and duplicate logs; it accepts only an attempt that exited 0 with no failing test and no undecodable packet, needs one for every version and kind, and records every other attempt as history. Its own checks are tested on altered copies of the evidence (`test-write-validation.js`).

## Hosted CI

Hosted CI [39976149433](https://github.com/HYPExMon5ter/mineflayer/actions/runs/39976149433) passed at `ee776144` on 2026-10-23: all 30 Minecraft test versions, lint, and Node.js 22/24 unit and type checks, with the required gate green. This published commit includes the second and third follow-ups and the real signed-chat ordering fix. The earlier baseline run [39754758116](https://github.com/HYPExMon5ter/mineflayer/actions/runs/39754758116) also passed at `ffc2bb45`, and push run [39976805895](https://github.com/HYPExMon5ter/mineflayer/actions/runs/39976805895) and pull request run [40010625824](https://github.com/HYPExMon5ter/mineflayer/actions/runs/40010625824) at `a1fca241`. The spawn readiness follow-up `970eba23`, the teleport confirmation follow-up `cb248a03`, the test isolation follow-up `ff4ad5b0`, the dropped item follow-up `16fd831a` and the teleport lifecycle follow-ups `8ffb2d8d` and `060b882d` first ran on hosted CI at `15136195`: push run [40072028091](https://github.com/HYPExMon5ter/mineflayer/actions/runs/40072028091) and pull request run [40072032019](https://github.com/HYPExMon5ter/mineflayer/actions/runs/40072032019). Each passed lint, unit, types and seven of the eight Minecraft jobs. Each failed `MC 26.2 26.3`, and with it the required gate, on one internal 26.3 test whose timing the local Windows runs never exposed (see the follow-up at `858e6bb0`). `858e6bb0`, `d3e13adf` and `7af17f87` had not run on hosted CI when this record was written.

## Results

- Internal protocol-server matrix: **2273 passing, 292 pending, zero failures across 30 versions**. Pending tests are version/feature skips.
- Internal + vanilla server suites: **4316 passing, 292 pending, zero failures across 30 versions** in the accepted attempts (every attempt is listed below), including `toolSpeeds` (2 to 7 tests per version) and failing a version on any undecodable packet.
- `digEverything` (opt-in, run separately with at most four servers at once): **24124 blocks dug, zero failures across 30 versions** in the accepted attempts. Each dig is checked against the server: after the server has handled the dig (from 1.19 its acknowledgement, before that a command round trip) the block it left must be gone, and from 1.19 `/execute unless block` must confirm it. Skipped by name: blocks that break at once without support the flat world lacks, bubble columns, and on 1.19.3, 1.19.4, 1.20.4, 1.20.6 and 1.21.3 the blocks those releases only have behind an experimental feature flag.
- Under lag: the vanilla suites (`digEverything` excluded) through a proxy that delays each direction by 150 ms, on 1.8.8, 1.12.2, 1.16.5, 1.18.2, 1.20.4, 1.21.11, 26.3:

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 66 | 0 |
| 1.12.2 | 66 | 0 |
| 1.16.5 | 66 | 0 |
| 1.18.2 | 68 | 0 |
| 1.20.4 | 69 | 0 |
| 1.21.11 | 70 | 0 |
| 26.3 | 71 | 0 |

- Standalone unit/regression suite: **88 passing**. Lint and the TypeScript consumer check (`test:types`) pass.
- Clean application install of the packed tarball (no shrinkwrap) without `overrides`: one minecraft-data (`data-9`, documented integrity) and one forked prismarine-item serve every package; the corrected 26.3 packet table and particles, 1.20.5+ enchantments and item names, dig times and tool speeds, attribute IDs, the protocol reader fix and non-decreasing chat timestamps are present.

### Companion packages

| Package | Commit | Result |
|---|---|---|
| minecraft-protocol lint | `41e6cd2` | passes |
| minecraft-protocol focused suites | `41e6cd2` | 1153 passing, 15 pending |
| minecraft-protocol packet round trip (32 versions) | `41e6cd2` | 5680 passing |
| minecraft-protocol server suite (32 versions) | `41e6cd2` | 384 passing |
| minecraft-protocol client suite against real vanilla servers (32 versions) | `41e6cd2` | 128 passing, 64 pending |
| prismarine-chunk | `a9b77d8` | 333 passing |
| prismarine-physics | `fafa797` | 57 passing |
| prismarine-item | `fbef493` | 173 passing |
| minecraft-data schema and audit suite | `dbda901` | 1906 passing, 1 pending |
| node-minecraft-data wrapper | `fb9d5a7` | 902 passing |

The protocol `clientTest` (real vanilla servers, all 32 protocol versions) skips its upstream online-mode block, which needs Mojang credentials; it fails a version on any packet it cannot decode. minecraft-data's suite keeps its wall-clock guard (under 40 s from process start) and now passes it.

### Data checked against vanilla

The packet tables of 26.1–26.3 were compared entry by entry with the servers' registration order (bytecode), and item, block, block-state, entity, sound, particle, effect, attribute, command-argument and recipe-serializer IDs with the servers' own registry reports (`--reports`) for 1.20.6–26.3 (data-5). Block hardness, tools and names that made a vanilla server refuse or delay a `digEverything` dig were checked against each server's block registration bytecode (1.8–1.16, 1.18) or its `mineable` tags (1.17–26.3) (data-6 to data-8). For data-9, every tool's dig speed multiplier on every block was compared with what each server derives from its block tags (mineable tags, leaves, wool, sword and shears tags; tool material, shears and sword speeds checked in the 26.3 bytecode) for 1.17.1–26.3 (22 versions): no block differs (blocks behind an experimental flag excluded). Against data-8 the same comparison found 1 to 964 differing blocks per version; both runs are kept.

## Proxy and authentication

Live local runs with Velocity 4.3.0 (build 44, SHA-256 `85be73b90f295acd8d5d45a00ad10bac791d4b72b7554172612a89565ebaaa8f`), real Paper and vanilla server processes in fresh directories on loopback ports, and Mineflayer `912e8ca2`. Clients log in through the proxy, settle, chat, walk, switch to a second backend with `/server` and back where two backends of their version exist; each backend's own log must show the login. Velocity does not translate versions, so each client version uses a backend of its own.

| Scenario | Proxy | Backends | Clients | Refusals checked |
|---|---|---|---|---|
| legacy-offline | Velocity, legacy forwarding, offline mode | Paper 1.8.8, Paper 1.8.8, Paper 1.12.2 | 1.8.8 (switch and back): pass; 1.12.2: pass | – |
| modern-offline | Velocity, modern forwarding, offline mode | Paper 26.3, Paper 26.3, Paper 1.21.11, Paper 1.20.4 | 26.3 (switch and back): pass; 1.21.11: pass; 1.20.4: pass | – |
| legacy-online | Velocity, legacy forwarding, online mode | Paper 1.8.8, Paper 1.8.8 | 1.8.8 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| modern-online | Velocity, modern forwarding, online mode | Paper 26.3, Paper 26.3 | 26.3 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| vanilla-online-direct | none (direct, online mode) | vanilla 1.20.4 | 1.20.4: pass | no session (offline client): refused as expected; rejected access token: refused as expected |

Online-mode scenarios authenticate against a local stub of the Mojang session service (3 client joins, 3 server-side verifications, 6 refusals): the encryption handshake, the client's join and the proxy's or server's `hasJoined` check are real, the account authority is not. Each online scenario also confirms two refusals with their expected cause: an offline client without a session, and a client whose access token the session service rejects.

### Real Microsoft account

The account owner signed in with a real Microsoft account once, with the device code flow; every later run reused that cached session through Mineflayer's normal `auth: 'microsoft'` login (`audit-artifacts/live-auth/run.js`). Each run starts a fresh vanilla server with `online-mode=true` and `enforce-secure-profile=true` on loopback; the server's authenticator verifies the account, the bot must spawn, and its chat must come back as signed player chat, which the server logs without a "Not Secure" mark. Result files record packet names, times and booleans only, no keys, signatures or tokens. Every attempt, failed ones included (58):

| # | Mineflayer | minecraft-protocol | Server | Chat sent at | Ticks/s | Result | Note |
|---:|---|---|---|---|---:|---|---|
| 1 | `4ff8872c` | `c76f895` | 26.3 | spawn | 20 | echoed | Second follow-up dependencies (data-8, minecraft-protocol c76f895). |
| 2 | `7b3a5ae8` | `41e6cd2` | 26.3 | spawn | 20 | **failed**: no chat echo (server: missing profile public key) | First run at the third follow-up (minecraft-protocol 41e6cd2). |
| 3 | `7b3a5ae8` | `41e6cd2` | 26.3 | spawn | 20 | **failed**: no chat echo (server: missing profile public key) | Repeated with the certificate request logged: HTTP 200, keys and a chat session present. |
| 4 | `7b3a5ae8` | `41e6cd2` | 26.3 | spawn | 20 | **failed**: no chat echo (server: missing profile public key) | Traced: the chat left before the server applied the session. |
| 5 | `7b3a5ae8` | `41e6cd2` | 26.3 | spawn | 2 | **failed**: no chat echo (server: missing profile public key) | Traced at 2 ticks per second. |
| 6 | `7b3a5ae8` | – | 26.3 | spawn | 2 | echoed | Development check before the fix was committed: minecraft-protocol 41e6cd2 with the fixed files copied into node_modules. |
| 7 | `7b3a5ae8` | – | 26.3 | spawn | 20 | echoed | Development check before the fix was committed: minecraft-protocol 41e6cd2 with the fixed files copied into node_modules. |
| 8 | `7b3a5ae8` | – | 26.3 | spawn | 20 | echoed | Development check before the fix was committed: minecraft-protocol 41e6cd2 with the fixed files copied into node_modules. |
| 9 | `7b3a5ae8` | – | 26.3 | spawn | 20 | echoed | Development check before the fix was committed: minecraft-protocol 41e6cd2 with the fixed files copied into node_modules. |
| 10 | `7b3a5ae8` | – | 26.1 | spawn | 20 | echoed | Development check before the fix was committed: minecraft-protocol 41e6cd2 with the fixed files copied into node_modules. |
| 11 | `7b3a5ae8` | – | 26.2 | spawn | 20 | echoed | Development check before the fix was committed: minecraft-protocol 41e6cd2 with the fixed files copied into node_modules. |
| 12 | `7b3a5ae8` | – | 1.21.11 | spawn | 20 | echoed | Development check before the fix was committed: minecraft-protocol 41e6cd2 with the fixed files copied into node_modules. |
| 13 | `7b3a5ae8` | – | 1.20.4 | spawn | 20 | echoed | Development check before the fix was committed: minecraft-protocol 41e6cd2 with the fixed files copied into node_modules. |
| 14 | `7b3a5ae8` | – | 1.19.3 | spawn | 20 | echoed | Development check before the fix was committed: minecraft-protocol 41e6cd2 with the fixed files copied into node_modules. |
| 15 | `076df25d` | `e4e60be` | 26.3 | spawn | 20 | echoed | Superseded commit pinning minecraft-protocol e4e60be, whose code is that of 005d953 except a comment naming the affected versions. |
| 16 | `076df25d` | `e4e60be` | 26.3 | spawn | 20 | echoed | Superseded commit pinning minecraft-protocol e4e60be, whose code is that of 005d953 except a comment naming the affected versions. |
| 17 | `076df25d` | `e4e60be` | 26.3 | spawn | 20 | echoed | Superseded commit pinning minecraft-protocol e4e60be, whose code is that of 005d953 except a comment naming the affected versions. |
| 18 | `076df25d` | `e4e60be` | 26.3 | spawn | 2 | echoed | Superseded commit pinning minecraft-protocol e4e60be, whose code is that of 005d953 except a comment naming the affected versions. |
| 19 | `076df25d` | `e4e60be` | 26.1 | spawn | 20 | echoed | Superseded commit pinning minecraft-protocol e4e60be, whose code is that of 005d953 except a comment naming the affected versions. |
| 20 | `076df25d` | `e4e60be` | 26.2 | spawn | 20 | echoed | Superseded commit pinning minecraft-protocol e4e60be, whose code is that of 005d953 except a comment naming the affected versions. |
| 21 | `076df25d` | `e4e60be` | 1.21.11 | spawn | 20 | echoed | Superseded commit pinning minecraft-protocol e4e60be, whose code is that of 005d953 except a comment naming the affected versions. |
| 22 | `076df25d` | `e4e60be` | 1.20.4 | spawn | 20 | echoed | Superseded commit pinning minecraft-protocol e4e60be, whose code is that of 005d953 except a comment naming the affected versions. |
| 23 | `076df25d` | `e4e60be` | 1.19.3 | spawn | 20 | echoed | Superseded commit pinning minecraft-protocol e4e60be, whose code is that of 005d953 except a comment naming the affected versions. |
| 24 | `912e8ca2` | `41e6cd2` | 26.1 | spawn | 20 | **failed**: no chat echo (server: missing profile public key) | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 25 | `912e8ca2` | `41e6cd2` | 26.2 | spawn | 20 | **failed**: no chat echo (server: missing profile public key) | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 26 | `912e8ca2` | `41e6cd2` | 1.21.11 | spawn | 20 | **failed**: no chat echo (server: missing profile public key) | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 27 | `912e8ca2` | `41e6cd2` | 1.20.4 | spawn | 20 | echoed | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 28 | `912e8ca2` | `41e6cd2` | 1.19.3 | spawn | 20 | echoed | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 29 | `912e8ca2` | `41e6cd2` | 1.21.9 | spawn | 20 | echoed | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 30 | `912e8ca2` | `41e6cd2` | 1.21.8 | spawn | 20 | echoed | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 31 | `912e8ca2` | `41e6cd2` | 1.21.9 | spawn | 2 | echoed | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 32 | `912e8ca2` | `41e6cd2` | 1.21.8 | spawn | 2 | echoed | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 33 | `912e8ca2` | `41e6cd2` | 1.21.9 | login | 20 | echoed | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 34 | `912e8ca2` | `41e6cd2` | 1.21.8 | login | 20 | echoed | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 35 | `912e8ca2` | `41e6cd2` | 26.3 | login | 20 | **failed**: no chat echo (server: missing profile public key) | Without the fix, from the clean 912e8ca2 evidence worktree. |
| 36 | `ec5885d6` | `005d953` | 26.3 | spawn | 20 | echoed | Follow-up commit, clean worktree. |
| 37 | `ec5885d6` | `005d953` | 26.3 | spawn | 20 | echoed | Follow-up commit, clean worktree. |
| 38 | `ec5885d6` | `005d953` | 26.3 | spawn | 20 | echoed | Follow-up commit, clean worktree. |
| 39 | `ec5885d6` | `005d953` | 26.3 | spawn | 2 | echoed | Follow-up commit, clean worktree. |
| 40 | `ec5885d6` | `005d953` | 26.1 | spawn | 20 | echoed | Follow-up commit, clean worktree. |
| 41 | `ec5885d6` | `005d953` | 26.2 | spawn | 20 | echoed | Follow-up commit, clean worktree. |
| 42 | `ec5885d6` | `005d953` | 1.21.11 | spawn | 20 | echoed | Follow-up commit, clean worktree. |
| 43 | `ec5885d6` | `005d953` | 1.21.9 | spawn | 20 | echoed | Follow-up commit, clean worktree. |
| 44 | `ec5885d6` | `005d953` | 1.21.8 | spawn | 20 | echoed | Follow-up commit, clean worktree. |
| 45 | `ec5885d6` | `005d953` | 1.20.4 | spawn | 20 | echoed | Follow-up commit, clean worktree. |
| 46 | `ec5885d6` | `005d953` | 1.19.3 | spawn | 20 | echoed | Follow-up commit, clean worktree. |
| 47 | `ec5885d6` | `005d953` | 26.3 | login | 20 | echoed | Follow-up commit, clean worktree. |
| 48 | `ec5885d6` | `005d953` | 1.21.11 | login | 20 | echoed | Follow-up commit, clean worktree. |
| 49 | `ec5885d6` | `005d953` | 1.21.9 | login | 20 | echoed | Follow-up commit, clean worktree. |
| 50 | `ec5885d6` | `005d953` | 1.21.8 | login | 20 | echoed | Follow-up commit, clean worktree. |
| 51 | `ec5885d6` | `005d953` | 1.19.3 | login | 20 | echoed | Follow-up commit, clean worktree. |
| 52 | `970eba23` | `005d953` | 26.3 | spawn | 20 | echoed | Spawn readiness follow-up, clean worktree. |
| 53 | `970eba23` | `005d953` | 1.21.11 | spawn | 20 | echoed | Spawn readiness follow-up, clean worktree. |
| 54 | `970eba23` | `005d953` | 1.21.4 | spawn | 20 | echoed | Spawn readiness follow-up, clean worktree. |
| 55 | `cb248a03` | `005d953` | 26.3 | spawn | 20 | echoed | Teleport confirmation follow-up, clean worktree. |
| 56 | `cb248a03` | `005d953` | 1.21.11 | spawn | 20 | echoed | Teleport confirmation follow-up, clean worktree. |
| 57 | `cb248a03` | `005d953` | 1.21.4 | spawn | 20 | echoed | Teleport confirmation follow-up, clean worktree. |
| 58 | `cb248a03` | `005d953` | 1.20.4 | spawn | 20 | echoed | Teleport confirmation follow-up, clean worktree. |

The first sign-in passed at `4ff8872c`. At `7b3a5ae8` (the dependencies of `912e8ca2`) the chat failed: the server logged "Failed to update secure chat state for HYPExMon5ter: 'Chat disabled due to missing profile public key. Please try reconnecting.'" and dropped it, although the certificate request returned HTTP 200 and the client held its keys and a chat session. The packet trace showed the cause: the client announced its chat session (`chat_session_update`) on the login packet and chatted about 80 ms later on spawn; the server's rejection arrived about 20 ms after that, 2 ms before the server echoed the session back as applied (`player_info` with this player's chat session). From 1.21.9 the server hands the session update to a packet queue it drains once per tick, but handles chat from its main task queue, which also runs between ticks (`PacketUtils.ensureRunningOnSameThread` and `ServerGamePacketListenerImpl.tryHandleChat`, checked in the 1.21.9, 1.21.11 and 26.1–26.3 jars; 1.20.6–1.21.8 run both from the main task queue in arrival order). Without the fix the race was lost on 1.21.11 and 26.1–26.3 in every run, and not on 1.21.9 in three runs, one sending the chat on the login packet; why 1.21.9 handled the chat after its next tick was not established. 1.21.8, 1.20.4 and 1.19.3 passed without the fix. No change between `4ff8872c` and `912e8ca2` is in the session or chat sending code (the protocol changes were a bundle test and chat timestamps), and the outcome depends on where the chat falls in the server's tick, so the first pass is consistent with having won the same race; that was not shown.

minecraft-protocol `005d953` holds chat until the server has answered a statistics request written after the session update, which the server answers from the queue that applies the session (see AUDIT.md). With it every run passed, including chat sent on the login packet, which fails on 26.3 without it, and runs with the server slowed to 2 ticks per second.

## Follow-up at `ec5885d6`

`ec5885d6` pins minecraft-protocol `005d953` (signed chat held until the server has applied the chat session) and confirms creative slots through the protocol's statistics requests (see AUDIT.md). It was checked with targeted runs, not the full matrices of this record: the internal and vanilla suites on the 10 versions whose creative slot confirmation uses statistics requests, from a clean worktree whose logs name that commit and its shrinkwrap's dependencies; the companion checks below; and the real Microsoft account runs above. The same protocol checks at `e4e60be`, whose code differs from `005d953` only in a comment, also passed (`companions/protocol-*-2.log`, not part of this record).

| Java version | Passing | Pending |
|---|---:|---:|
| 1.21.3 | 150 | 4 |
| 1.21.4 | 152 | 2 |
| 1.21.5 | 152 | 2 |
| 1.21.6 | 152 | 2 |
| 1.21.8 | 152 | 2 |
| 1.21.9 | 153 | 2 |
| 1.21.11 | 153 | 2 |
| 26.1 | 158 | 2 |
| 26.2 | 158 | 2 |
| 26.3 | 160 | 1 |

| Package | Commit | Result |
|---|---|---|
| mineflayer lint | `ec5885d` | passes |
| mineflayer unit | `ec5885d` | 88 passing |
| mineflayer types | `ec5885d` | passes |
| minecraft-protocol lint | `005d953` | passes |
| minecraft-protocol focused suites | `005d953` | 1166 passing, 15 pending |
| minecraft-protocol packet round trip (32 versions) | `005d953` | 5680 passing |
| minecraft-protocol server suite (32 versions) | `005d953` | 384 passing |

## Follow-up at `970eba23`

`970eba23` emits `spawn` on 1.21.4+ only after `player_loaded`, so a spawn listener's interactions are no longer dropped by the server (see AUDIT.md, Spawn readiness); it pins the same dependencies as `ec5885d6`. The change is in a plugin every version loads and the vanilla `spawnEvent` test changed for every version, so it was checked with targeted runs from a clean worktree whose logs name that commit and its shrinkwrap's dependencies: the internal suite on all 30 versions; the internal and vanilla suites on the versions that send `player_loaded`; `spawnEvent` alone on all 30 versions; the vanilla suites through the latency proxy on 1.21.11 and 26.3, since spawn now waits for terrain; the Velocity scenarios, whose server switches log in again without a respawn; the companion checks below; and real Microsoft account runs (listed above).

`internal-970eba23` (internal suite): Internal suite on all 30 versions: the health plugin changed for every version.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 65 | 20 |
| 1.9.4 | 67 | 18 |
| 1.10.2 | 67 | 18 |
| 1.11.2 | 67 | 18 |
| 1.12.2 | 67 | 18 |
| 1.13.2 | 67 | 18 |
| 1.14.4 | 67 | 18 |
| 1.15.2 | 67 | 18 |
| 1.16.5 | 67 | 18 |
| 1.17.1 | 71 | 14 |
| 1.18.2 | 71 | 14 |
| 1.19 | 74 | 11 |
| 1.19.2 | 74 | 11 |
| 1.19.3 | 74 | 11 |
| 1.19.4 | 75 | 10 |
| 1.20.1 | 75 | 10 |
| 1.20.2 | 78 | 7 |
| 1.20.4 | 79 | 6 |
| 1.20.6 | 78 | 7 |
| 1.21.1 | 79 | 6 |
| 1.21.3 | 81 | 4 |
| 1.21.4 | 83 | 2 |
| 1.21.5 | 83 | 2 |
| 1.21.6 | 83 | 2 |
| 1.21.8 | 83 | 2 |
| 1.21.9 | 83 | 2 |
| 1.21.11 | 83 | 2 |
| 26.1 | 88 | 2 |
| 26.2 | 88 | 2 |
| 26.3 | 89 | 1 |

`suite-970eba23` (server suites): Internal and vanilla suites on the versions that send `player_loaded` (1.21.4+).

| Java version | Passing | Pending |
|---|---:|---:|
| 1.21.4 | 152 | 2 |
| 1.21.5 | 152 | 2 |
| 1.21.6 | 152 | 2 |
| 1.21.8 | 152 | 2 |
| 1.21.9 | 153 | 2 |
| 1.21.11 | 153 | 2 |
| 26.1 | 158 | 2 |
| 26.2 | 158 | 2 |
| 26.3 | 160 | 1 |

`spawn-970eba23` (vanilla `spawnEvent`): The changed vanilla `spawnEvent` test alone on all 30 versions.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 1 | 0 |
| 1.9.4 | 1 | 0 |
| 1.10.2 | 1 | 0 |
| 1.11.2 | 1 | 0 |
| 1.12.2 | 1 | 0 |
| 1.13.2 | 1 | 0 |
| 1.14.4 | 1 | 0 |
| 1.15.2 | 1 | 0 |
| 1.16.5 | 1 | 0 |
| 1.17.1 | 1 | 0 |
| 1.18.2 | 1 | 0 |
| 1.19 | 1 | 0 |
| 1.19.2 | 1 | 0 |
| 1.19.3 | 1 | 0 |
| 1.19.4 | 1 | 0 |
| 1.20.1 | 1 | 0 |
| 1.20.2 | 1 | 0 |
| 1.20.4 | 1 | 0 |
| 1.20.6 | 1 | 0 |
| 1.21.1 | 1 | 0 |
| 1.21.3 | 1 | 0 |
| 1.21.4 | 1 | 0 |
| 1.21.5 | 1 | 0 |
| 1.21.6 | 1 | 0 |
| 1.21.8 | 1 | 0 |
| 1.21.9 | 1 | 0 |
| 1.21.11 | 1 | 0 |
| 26.1 | 1 | 0 |
| 26.2 | 1 | 0 |
| 26.3 | 1 | 0 |

`lag150-970eba23` (server suites through the latency proxy, 150 ms each way): Vanilla suites through the latency proxy: spawn now waits for the terrain under the player.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.21.11 | 70 | 0 |
| 26.3 | 71 | 0 |

| Scenario | Proxy | Backends | Clients | Refusals checked |
|---|---|---|---|---|
| legacy-offline | Velocity, legacy forwarding, offline mode | Paper 1.8.8, Paper 1.8.8, Paper 1.12.2 | 1.8.8 (switch and back): pass; 1.12.2: pass | – |
| modern-offline | Velocity, modern forwarding, offline mode | Paper 26.3, Paper 26.3, Paper 1.21.11, Paper 1.20.4 | 26.3 (switch and back): pass; 1.21.11: pass; 1.20.4: pass | – |
| legacy-online | Velocity, legacy forwarding, online mode | Paper 1.8.8, Paper 1.8.8 | 1.8.8 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| modern-online | Velocity, modern forwarding, online mode | Paper 26.3, Paper 26.3 | 26.3 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| vanilla-online-direct | none (direct, online mode) | vanilla 1.20.4 | 1.20.4: pass | no session (offline client): refused as expected; rejected access token: refused as expected |

| Package | Commit | Result |
|---|---|---|
| mineflayer lint | `970eba2` | passes |
| mineflayer unit | `970eba2` | 94 passing |
| mineflayer types | `970eba2` | passes |

Development checks for this follow-up (in `audit-artifacts/followup3/dev/clear-after-container-970eba23`, not counted): `spawnEvent` on 26.3 failed 3 of 3 runs with `health.js` of `a1fca241` ("the server ignored an item used on spawn") and passed with the fix; and the `/clear` check described in AUDIT.md's limitations, run on 26.3 and 1.21.8.

## Follow-up at `cb248a03`

`cb248a03` (the fix is `cbcff236`; `ae0ed690` and `cb248a03` only change the new `spawnEvent` check: it clicks the chest once it loads before 1.21.4, and lays its own floor) announces `spawn`, and `player_loaded` on 1.21.4+, only once the bot has confirmed the server's latest teleport, which servers require before they accept a block interaction (see AUDIT.md, Spawn readiness); it pins the same dependencies as `ec5885d6`. Spawn timing changed on every version, so it was checked from a clean worktree whose logs name that commit and its shrinkwrap's dependencies with: the internal suite and the internal and vanilla suites on all 30 versions; `spawnEvent` alone three times on 1.8.8, 1.12.2, 1.16.5, 1.20.1, 1.21.3, 1.21.4 and 26.3, the versions whose unfixed runs are listed below; the vanilla suites through the latency proxy on 1.8.8, 1.12.2, 1.21.11 and 26.3; the Velocity scenarios; the companion checks below; and real Microsoft account runs (listed above). The full matrices of this record, including `digEverything`, were not rerun: the change does not touch digging or block data.

`internal-cb248a03` (internal suite): Internal suite on all 30 versions: the health and physics plugins changed for every version.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 70 | 21 |
| 1.9.4 | 72 | 19 |
| 1.10.2 | 72 | 19 |
| 1.11.2 | 72 | 19 |
| 1.12.2 | 72 | 19 |
| 1.13.2 | 72 | 19 |
| 1.14.4 | 72 | 19 |
| 1.15.2 | 72 | 19 |
| 1.16.5 | 72 | 19 |
| 1.17.1 | 76 | 15 |
| 1.18.2 | 76 | 15 |
| 1.19 | 79 | 12 |
| 1.19.2 | 79 | 12 |
| 1.19.3 | 79 | 12 |
| 1.19.4 | 80 | 11 |
| 1.20.1 | 80 | 11 |
| 1.20.2 | 84 | 7 |
| 1.20.4 | 85 | 6 |
| 1.20.6 | 84 | 7 |
| 1.21.1 | 85 | 6 |
| 1.21.3 | 87 | 4 |
| 1.21.4 | 89 | 2 |
| 1.21.5 | 89 | 2 |
| 1.21.6 | 89 | 2 |
| 1.21.8 | 89 | 2 |
| 1.21.9 | 89 | 2 |
| 1.21.11 | 89 | 2 |
| 26.1 | 94 | 2 |
| 26.2 | 94 | 2 |
| 26.3 | 95 | 1 |

`suite-cb248a03` (server suites): Internal and vanilla suites on all 30 versions: spawn timing changed on every version.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 136 | 21 |
| 1.9.4 | 138 | 19 |
| 1.10.2 | 138 | 19 |
| 1.11.2 | 138 | 19 |
| 1.12.2 | 138 | 19 |
| 1.13.2 | 138 | 19 |
| 1.14.4 | 138 | 19 |
| 1.15.2 | 138 | 19 |
| 1.16.5 | 138 | 19 |
| 1.17.1 | 144 | 15 |
| 1.18.2 | 144 | 15 |
| 1.19 | 147 | 12 |
| 1.19.2 | 147 | 12 |
| 1.19.3 | 147 | 12 |
| 1.19.4 | 148 | 11 |
| 1.20.1 | 149 | 11 |
| 1.20.2 | 153 | 7 |
| 1.20.4 | 154 | 6 |
| 1.20.6 | 153 | 7 |
| 1.21.1 | 154 | 6 |
| 1.21.3 | 156 | 4 |
| 1.21.4 | 158 | 2 |
| 1.21.5 | 158 | 2 |
| 1.21.6 | 158 | 2 |
| 1.21.8 | 158 | 2 |
| 1.21.9 | 159 | 2 |
| 1.21.11 | 159 | 2 |
| 26.1 | 164 | 2 |
| 26.2 | 164 | 2 |
| 26.3 | 166 | 1 |

`spawn-cb248a03-a` (vanilla `spawnEvent`): The vanilla `spawnEvent` test alone on the versions of the unfixed baseline, attempt 1 of 3.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 1 | 0 |
| 1.12.2 | 1 | 0 |
| 1.16.5 | 1 | 0 |
| 1.20.1 | 1 | 0 |
| 1.21.3 | 1 | 0 |
| 1.21.4 | 1 | 0 |
| 26.3 | 1 | 0 |

`spawn-cb248a03-b` (vanilla `spawnEvent`): Attempt 2 of 3.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 1 | 0 |
| 1.12.2 | 1 | 0 |
| 1.16.5 | 1 | 0 |
| 1.20.1 | 1 | 0 |
| 1.21.3 | 1 | 0 |
| 1.21.4 | 1 | 0 |
| 26.3 | 1 | 0 |

`spawn-cb248a03-c` (vanilla `spawnEvent`): Attempt 3 of 3.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 1 | 0 |
| 1.12.2 | 1 | 0 |
| 1.16.5 | 1 | 0 |
| 1.20.1 | 1 | 0 |
| 1.21.3 | 1 | 0 |
| 1.21.4 | 1 | 0 |
| 26.3 | 1 | 0 |

`lag150-cb248a03` (server suites through the latency proxy, 150 ms each way): Vanilla suites through the latency proxy on two legacy and two modern versions.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 66 | 0 |
| 1.12.2 | 66 | 0 |
| 1.21.11 | 70 | 0 |
| 26.3 | 71 | 0 |

| Scenario | Proxy | Backends | Clients | Refusals checked |
|---|---|---|---|---|
| legacy-offline | Velocity, legacy forwarding, offline mode | Paper 1.8.8, Paper 1.8.8, Paper 1.12.2 | 1.8.8 (switch and back): pass; 1.12.2: pass | – |
| modern-offline | Velocity, modern forwarding, offline mode | Paper 26.3, Paper 26.3, Paper 1.21.11, Paper 1.20.4 | 26.3 (switch and back): pass; 1.21.11: pass; 1.20.4: pass | – |
| legacy-online | Velocity, legacy forwarding, online mode | Paper 1.8.8, Paper 1.8.8 | 1.8.8 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| modern-online | Velocity, modern forwarding, online mode | Paper 26.3, Paper 26.3 | 26.3 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| vanilla-online-direct | none (direct, online mode) | vanilla 1.20.4 | 1.20.4: pass | no session (offline client): refused as expected; rejected access token: refused as expected |

| Package | Commit | Result |
|---|---|---|
| mineflayer lint | `cb248a0` | passes |
| mineflayer unit | `cb248a0` | 97 passing |
| mineflayer types | `cb248a0` | passes |

The unfixed baseline is the library of `dd781b6a` with the new tests (runs `spawn-baseline-*` in the list below, at commits `6a5c46bc`, `c999f2a3` and `ae5a64a9` made only for them, carrying the tests of `cbcff236`, `ae0ed690` and `cb248a03`). The runs at `ae0ed690` are kept in the list as superseded: their only failures were the 1.8.8 chest check through the latency proxy, from the hole described in AUDIT.md, and `furnace` on 26.3 through the proxy, where the bot picked up a white bed item that the `bed` test had dropped about 80 s earlier (entity 22 in the packet trace) while a creative slot set was in flight, so the server reported the bed in that slot; that item is removed by the reset since the next follow-up. The reviewer's reproduction `audit-artifacts/astra-review-970eba23/spawn-teleport.cjs` was run on both commits; its logs are in `audit-artifacts/followup3/dev/r8-ae0ed690` with the development runs of this follow-up, which are not counted (they include a first run of the new chest check that the server refused only because of spawn protection, and wire tests whose harness mistakes were corrected before the commit).

## Follow-up at `ff4ad5b0`

`ff4ad5b0` changes only the vanilla test harness and one test; the library and its dependencies are those of `cb248a03`.

- `bbb2c2c7` makes `resetState`, which runs before every vanilla test, remove every dropped item after its world reset (see AUDIT.md, Test isolation). This fixes the `furnace` failure of `lag150-ae0ed690`. The packet trace of that run shows the bed item (entity 22) spawning during the reset after `bed`, whose fill broke the bed; from 1.13 the half left behind drops the item. `fishing`'s water then moved it from (3.27, -60, 0.93) to (2.41, -60, -0.03), inside the block where `furnace` places its furnace, and the placement pushed it to the bot, which collected it into slot 37 about 1.5 s after `furnace` started, while the creative set of that slot was in flight. Two new `resetState` tests fail without the change: one runs `bed` and then a reset, the other tosses a stack in a test that changes no block, so the reset skips its fills. In run `drops-baseline-eea8cd5a` (the reset of `edb5d2b5` with the new tests, at a commit made only for it), the tossed stack remained on all 30 versions and the bed item from 1.13.2 on; 1.8.8–1.12.2 break the bed without a drop. The same commit makes the test helpers recognise a dropped item by every name Mineflayer gives it: 1.13 calls the item object `item_stack`, so `removeDrops` (used by `toolSpeeds` and `digEverything`) had never found the drops on 1.13.2 and skipped its kill.
- `ff4ad5b0` fixes the `time` test, which waited only for the time of day to be near 18000 before checking that the daylight cycle was off. The new `resetState` test runs `bed`, which sets 18000, shortly before `time`, so in `lag150-bbb2c2c7` an update sent before the gamerule applied ended the wait on 1.12.2 and 26.3 (packet traces: a periodic update with time 18424 on 1.12.2; on 26.3 an update carrying only the age, which the client applied to its clock at 18492). The test now also waits for the cycle to be off.

The reset runs before every vanilla test on every version, so the commit was checked from a clean worktree whose logs name it and its shrinkwrap's dependencies: the internal and vanilla suites on all 30 versions, the vanilla suites through the latency proxy on the versions of the earlier lag runs, `digEverything` on 1.13.2, and the companion checks below. The Velocity scenarios and the real-account runs were not repeated: the library did not change.

`suite-ff4ad5b0` (server suites): The internal and vanilla suites on every version, including the new `resetState` tests.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 138 | 21 |
| 1.9.4 | 140 | 19 |
| 1.10.2 | 140 | 19 |
| 1.11.2 | 140 | 19 |
| 1.12.2 | 140 | 19 |
| 1.13.2 | 140 | 19 |
| 1.14.4 | 140 | 19 |
| 1.15.2 | 140 | 19 |
| 1.16.5 | 140 | 19 |
| 1.17.1 | 146 | 15 |
| 1.18.2 | 146 | 15 |
| 1.19 | 149 | 12 |
| 1.19.2 | 149 | 12 |
| 1.19.3 | 149 | 12 |
| 1.19.4 | 150 | 11 |
| 1.20.1 | 151 | 11 |
| 1.20.2 | 155 | 7 |
| 1.20.4 | 156 | 6 |
| 1.20.6 | 155 | 7 |
| 1.21.1 | 156 | 6 |
| 1.21.3 | 158 | 4 |
| 1.21.4 | 160 | 2 |
| 1.21.5 | 160 | 2 |
| 1.21.6 | 160 | 2 |
| 1.21.8 | 160 | 2 |
| 1.21.9 | 161 | 2 |
| 1.21.11 | 161 | 2 |
| 26.1 | 166 | 2 |
| 26.2 | 166 | 2 |
| 26.3 | 168 | 1 |

`lag150-ff4ad5b0` (server suites through the latency proxy, 150 ms each way): The vanilla suites through the latency proxy, where the `furnace` failure occurred.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 68 | 0 |
| 1.12.2 | 68 | 0 |
| 1.21.11 | 72 | 0 |
| 26.3 | 73 | 0 |

`dig-ff4ad5b0-1.13.2` (`digEverything`): `digEverything` on 1.13.2, the only version whose `removeDrops` changed: it now finds the drops, named `item_stack` there.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.13.2 | 547 | 0 |

| Package | Commit | Result |
|---|---|---|
| mineflayer lint | `ff4ad5b` | passes |
| mineflayer unit | `ff4ad5b` | 97 passing |
| mineflayer types | `ff4ad5b` | passes |

Development runs for this follow-up are in `audit-artifacts/followup3/dev/r10-drops` and are not counted. They are: `bed` then `furnace` on 26.3 through the proxy, with a line added to `furnace` (not committed) that moves any dropped item to where the trace found the bed item. That failed 2 of 2 times at `edb5d2b5` ("Server rejected": the bed item went into slot 37 during its creative set) and passed 2 of 2 times with the change; the `resetState` tests with and without the reset's removal; and `resetState`'s bed test followed by `time` through the proxy. On 26.3 the old `time` failed 1 of 1 runs and the new one passed; on 1.12.2 both passed 5 of 5, because the race needs a periodic update to be in flight at that moment. Three more attempts of each on 1.12.2 shared one server directory and were not valid runs. The first `resetState` runs recognised only the names `item` and `Item`, so they missed the bed item on 1.13.2. The name check was corrected before the commit, and the baseline run made with the uncorrected helper, `drops-baseline-47822c10`, is listed below as superseded.

## Follow-up at `16fd831a`

`16fd831a` pins the data release `java-26.3-data-10` and the companions rebuilt on it (minecraft-protocol `4fc8bc1`; the commits are in AUDIT.md), and adds the tests of the fix (see AUDIT.md, Dropped items on 1.8). The release differs from `data-9` only in `metadataIxOfItem` for 1.8, which is now 10, the key the 1.8.8 server registers a dropped item's stack under (EntityItem in the server jar) and sends it at (packet trace of a development run: key 10, type 5, the tossed stone with its count and name; nothing at key 8). The archive's other files are identical to `data-9` apart from the generated declaration and the wrapper's own test of the value; the companion commits change only that pin.

The new vanilla test `droppedItem` tosses a stack of seven named stone on a real server and reads it back with `entity.getDroppedItem()`, which must give its type, count, damage value and custom name. In run `droppedItem-baseline-1a56b7bd` (the library and data of `5b8123d8` with the new tests, at a commit made only for it) it failed on 1.8.8 only, where `getDroppedItem()` threw, and passed on the 29 other versions, so their keys were right. Because every package now resolves another data archive, the commit was checked from a clean worktree whose logs name it and its shrinkwrap's dependencies: the internal and vanilla suites on all 30 versions, the vanilla suites through the latency proxy on 1.8.8, 1.12.2, 1.21.11 and 26.3, a clean application install of the packed commit, and the companion checks below. `digEverything`, the Velocity scenarios and the real-account runs were not repeated: none of them reads the changed value, and the library did not change.

`suite-16fd831a` (server suites): The internal and vanilla suites on every version, including the new `droppedItem` test.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 139 | 21 |
| 1.9.4 | 141 | 19 |
| 1.10.2 | 141 | 19 |
| 1.11.2 | 141 | 19 |
| 1.12.2 | 141 | 19 |
| 1.13.2 | 141 | 19 |
| 1.14.4 | 141 | 19 |
| 1.15.2 | 141 | 19 |
| 1.16.5 | 141 | 19 |
| 1.17.1 | 147 | 15 |
| 1.18.2 | 147 | 15 |
| 1.19 | 150 | 12 |
| 1.19.2 | 150 | 12 |
| 1.19.3 | 150 | 12 |
| 1.19.4 | 151 | 11 |
| 1.20.1 | 152 | 11 |
| 1.20.2 | 156 | 7 |
| 1.20.4 | 157 | 6 |
| 1.20.6 | 156 | 7 |
| 1.21.1 | 157 | 6 |
| 1.21.3 | 159 | 4 |
| 1.21.4 | 161 | 2 |
| 1.21.5 | 161 | 2 |
| 1.21.6 | 161 | 2 |
| 1.21.8 | 161 | 2 |
| 1.21.9 | 162 | 2 |
| 1.21.11 | 162 | 2 |
| 26.1 | 167 | 2 |
| 26.2 | 167 | 2 |
| 26.3 | 169 | 1 |

`lag150-16fd831a` (server suites through the latency proxy, 150 ms each way): The vanilla suites through the latency proxy on the versions of the previous follow-up.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 69 | 0 |
| 1.12.2 | 69 | 0 |
| 1.21.11 | 73 | 0 |
| 26.3 | 74 | 0 |

| Package | Commit | Result |
|---|---|---|
| mineflayer lint | `16fd831` | passes |
| mineflayer unit | `16fd831` | 98 passing |
| mineflayer types | `16fd831` | passes |
| minecraft-protocol lint | `4fc8bc1` | passes |
| minecraft-protocol focused suites | `4fc8bc1` | 1166 passing, 15 pending |
| minecraft-protocol packet round trip (32 versions) | `4fc8bc1` | 5680 passing |
| minecraft-protocol server suite (32 versions) | `4fc8bc1` | 384 passing |
| prismarine-chunk | `a1b092a` | 333 passing |
| prismarine-physics | `9a6e364` | 57 passing |
| prismarine-item | `40bc3c2` | 173 passing |
| minecraft-data schema and audit suite | `6c096ad` | 1906 passing, 1 pending |
| node-minecraft-data wrapper | `e1a7d00` | 902 passing |

The clean application install (`consumer-check-16fd831a.log`) resolves one minecraft-data, `data-10` with the documented integrity, and one forked prismarine-item for every package, and every package of the chain, prismarine-entity included, reads key 10 for 1.8; the earlier checks of that script (26.3 packet table, particles, items, dig times, protocol fixes) also passed. Development runs for this follow-up are in `audit-artifacts/followup3/dev/r11-dropped-item` and are not counted: `droppedItem` on 1.8.8 with `data-9` (failed: `getDroppedItem()` threw), and on all 30 versions with the corrected file copied over the installed data before the release was built (all passed).

## Follow-up at `8ffb2d8d`

`192629a7` and `973fe4fa` fix two gaps that a review of `c5fc650d` found when several teleports arrive while spawn waits (see AUDIT.md, Spawn readiness). `6282be0f` and `8ffb2d8d` fix two vanilla tests that depended on chance (see AUDIT.md, Test isolation). They pin the same dependencies as `16fd831a`.

- `192629a7` keeps the 1.21.4+ terrain wait and its fallback armed until spawn is announced, and checks the terrain again at the player's position once the teleport confirmations are sent. A teleport queued behind them into a column that has not arrived no longer gets `player_loaded` and `spawn` announced there.
- `973fe4fa` makes answering a teleport cancel a reply deferred after a death. When two post-death teleports arrive before one tick, the superseded position is no longer sent 1.5 s later, no `forcedMove` is emitted for it, and on 1.8 spawn no longer waits for it.

Run `internal-baseline-448dbbb8` (in the list below) is the library of `c5fc650d` with the new tests, at a commit made only for it, on 1.8.8, 1.12.2, 1.21.3, 1.21.4 and 26.3. Its only failures are new tests:

- the two same-tick deferred reply tests, on every version before 26.3: the superseded position is sent, and on 1.8 the confirmation gate waits for it;
- three of the four column tests, on 1.21.4 and 26.3: spawn over a column that has not loaded, before the fallback.

The already-confirmed column test and the login tests are guards and pass there.

Spawn and teleport replies run on every version, so `8ffb2d8d` was checked from a clean worktree whose logs name it and its shrinkwrap's dependencies with:

- the internal and vanilla suites on all 30 versions;
- the vanilla suites through the latency proxy on 1.8.8, 1.12.2, 1.21.11 and 26.3;
- the Velocity scenarios, whose server switches log in again while spawn may be waiting;
- the companion checks below.

`digEverything`, the companion libraries and the real-account runs were not repeated: the change is in two Mineflayer plugins and two tests, and touches neither digging, data nor authentication.

`suite-8ffb2d8d` (server suites): The internal and vanilla suites on every version, with the new teleport tests.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 143 | 25 |
| 1.9.4 | 145 | 23 |
| 1.10.2 | 145 | 23 |
| 1.11.2 | 145 | 23 |
| 1.12.2 | 145 | 23 |
| 1.13.2 | 145 | 23 |
| 1.14.4 | 145 | 23 |
| 1.15.2 | 145 | 23 |
| 1.16.5 | 145 | 23 |
| 1.17.1 | 151 | 19 |
| 1.18.2 | 151 | 19 |
| 1.19 | 154 | 16 |
| 1.19.2 | 154 | 16 |
| 1.19.3 | 154 | 16 |
| 1.19.4 | 155 | 15 |
| 1.20.1 | 156 | 15 |
| 1.20.2 | 160 | 11 |
| 1.20.4 | 161 | 10 |
| 1.20.6 | 160 | 11 |
| 1.21.1 | 161 | 10 |
| 1.21.3 | 163 | 8 |
| 1.21.4 | 169 | 2 |
| 1.21.5 | 169 | 2 |
| 1.21.6 | 169 | 2 |
| 1.21.8 | 169 | 2 |
| 1.21.9 | 170 | 2 |
| 1.21.11 | 170 | 2 |
| 26.1 | 175 | 2 |
| 26.2 | 175 | 2 |
| 26.3 | 177 | 1 |

`lag150-8ffb2d8d` (server suites through the latency proxy, 150 ms each way): The vanilla suites through the latency proxy on the versions of the previous follow-ups.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 69 | 0 |
| 1.12.2 | 69 | 0 |
| 1.21.11 | 73 | 0 |
| 26.3 | 74 | 0 |

| Scenario | Proxy | Backends | Clients | Refusals checked |
|---|---|---|---|---|
| legacy-offline | Velocity, legacy forwarding, offline mode | Paper 1.8.8, Paper 1.8.8, Paper 1.12.2 | 1.8.8 (switch and back): pass; 1.12.2: pass | – |
| modern-offline | Velocity, modern forwarding, offline mode | Paper 26.3, Paper 26.3, Paper 1.21.11, Paper 1.20.4 | 26.3 (switch and back): pass; 1.21.11: pass; 1.20.4: pass | – |
| legacy-online | Velocity, legacy forwarding, online mode | Paper 1.8.8, Paper 1.8.8 | 1.8.8 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| modern-online | Velocity, modern forwarding, online mode | Paper 26.3, Paper 26.3 | 26.3 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| vanilla-online-direct | none (direct, online mode) | vanilla 1.20.4 | 1.20.4: pass | no session (offline client): refused as expected; rejected access token: refused as expected |

| Package | Commit | Result |
|---|---|---|
| mineflayer lint | `8ffb2d8` | passes |
| mineflayer unit | `8ffb2d8` | 98 passing |
| mineflayer types | `8ffb2d8` | passes |

Three earlier suite runs of this follow-up are in the list below, none accepted:

- `suite-973fe4fa` passed on 29 versions. On 1.21.3 `placeEntity place armor stand` and `useChests` were refused. The packet trace shows that the summon egg test's zombie egg hatched a chicken jockey and only the zombie was killed, so the chicken stood on the block both tests place into. `6282be0f` also kills the zombie's vehicle.
- `suite-6282be0f` passed on 29 versions. On 1.15.2 the child process of `exampleInventory` exited: its `waitForChunksToLoad()`, called after the test teleported it, timed out waiting for 25 chunks, as `exampleBee` once did on 1.12.2 in the first follow-up. The example bot did not die and 1.15.2 has no terrain wait, so neither changed code path ran. The cause was established later, in development runs that traced the example's own process (`audit-artifacts/followup3/dev/r13-example-chunks`). The vanilla server had stopped reading the example's connection when it switched it from login to play. It never handled the example's settings, keep-alive or confirmation of the `/tp`, so it never moved the example's chunk view. The test bot's trace of this run shows that the server never applied the example's settings. AUDIT.md describes the server race; it is not a Mineflayer defect.
- `suite-6282be0f-b` is the same commit run again. It passed on 29 versions, 1.15.2 and 1.21.3 included. On 1.17.1 `nether` was refused its sign: the trace shows the generated nether roof had a brown mushroom where the sign goes, which a sign does not replace, and every teleport had been confirmed more than a second before the click. `8ffb2d8d` sets that spot to air first.

Development runs on 1.21.3 and 1.17.1 forced a jockey (`/summon`, `/ride`) and a mushroom (`/setblock`). With the old tests they failed as in the suite runs; with the fixes they passed. Lint, unit and type checks at `6282be0f` (`companions/mineflayer-*-7.log`) passed but are not part of this record.

The reviewer's reproductions (`audit-artifacts/astra-review-c5fc650d/run-review.cjs`: `terrain` on 1.21.4 and 26.3, `deferred` on 1.8.8, 1.12.2, 1.21.4 and 26.3) failed at `c5fc650d` as reported (2 of 2 and 3 of 4) and passed with the fixes. Their logs are in `audit-artifacts/followup3/dev/r12-lifecycle`, with the development runs of this follow-up, which are not counted. The first development runs of the new tests failed on harness mistakes, corrected before the commit: replies were recorded from when the bot sent them rather than when the server received them, and the 26.3 control expected no reply to the first of two post-death teleports, which 26.3 answers on its own tick.

## Follow-up at `060b882d`

`060b882d` fixes a gap that a review of `1e67f091` found in the reply deferred after a death (see AUDIT.md, Spawn readiness); it pins the same dependencies as `16fd831a`. A respawn inside the 1.5 s delay now cancels the deferred reply along with the queued teleports, so the previous world's position is no longer sent, no `forcedMove` is emitted for it, and on 1.8 actions waiting for teleport confirmations no longer wait for it.

Run `internal-baseline-c7e2a2dd` (in the list below) is the physics plugin of `1e67f091` with the new test, at a commit made only for it, on 1.8.8, 1.12.2, 1.21.3, 1.21.4 and 26.3. Its only failure is the new test, on every version before 26.3; 26.3 never defers the reply and passes.

The respawn handler runs on every version, so `060b882d` was checked from a clean worktree whose logs name it and its shrinkwrap's dependencies with:

- the internal and vanilla suites on all 30 versions;
- the vanilla suites through the latency proxy on 1.8.8, 1.12.2, 1.21.11 and 26.3;
- the Velocity scenarios, whose server switches move the bot to another server's world;
- the companion checks below.

`digEverything`, the companion libraries and the real-account runs were not repeated: the change is one call in the physics plugin's respawn handler and one internal test, and touches neither digging, data nor authentication.

`suite-060b882d` (server suites): The internal and vanilla suites on every version, with the new respawn test.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 144 | 25 |
| 1.9.4 | 146 | 23 |
| 1.10.2 | 146 | 23 |
| 1.11.2 | 146 | 23 |
| 1.12.2 | 146 | 23 |
| 1.13.2 | 146 | 23 |
| 1.14.4 | 146 | 23 |
| 1.15.2 | 146 | 23 |
| 1.16.5 | 146 | 23 |
| 1.17.1 | 152 | 19 |
| 1.18.2 | 152 | 19 |
| 1.19 | 155 | 16 |
| 1.19.2 | 155 | 16 |
| 1.19.3 | 155 | 16 |
| 1.19.4 | 156 | 15 |
| 1.20.1 | 157 | 15 |
| 1.20.2 | 161 | 11 |
| 1.20.4 | 162 | 10 |
| 1.20.6 | 161 | 11 |
| 1.21.1 | 162 | 10 |
| 1.21.3 | 164 | 8 |
| 1.21.4 | 170 | 2 |
| 1.21.5 | 170 | 2 |
| 1.21.6 | 170 | 2 |
| 1.21.8 | 170 | 2 |
| 1.21.9 | 171 | 2 |
| 1.21.11 | 171 | 2 |
| 26.1 | 176 | 2 |
| 26.2 | 176 | 2 |
| 26.3 | 178 | 1 |

`lag150-060b882d` (server suites through the latency proxy, 150 ms each way): The vanilla suites through the latency proxy on the versions of the previous follow-ups.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 69 | 0 |
| 1.12.2 | 69 | 0 |
| 1.21.11 | 73 | 0 |
| 26.3 | 74 | 0 |

| Scenario | Proxy | Backends | Clients | Refusals checked |
|---|---|---|---|---|
| legacy-offline | Velocity, legacy forwarding, offline mode | Paper 1.8.8, Paper 1.8.8, Paper 1.12.2 | 1.8.8 (switch and back): pass; 1.12.2: pass | – |
| modern-offline | Velocity, modern forwarding, offline mode | Paper 26.3, Paper 26.3, Paper 1.21.11, Paper 1.20.4 | 26.3 (switch and back): pass; 1.21.11: pass; 1.20.4: pass | – |
| legacy-online | Velocity, legacy forwarding, online mode | Paper 1.8.8, Paper 1.8.8 | 1.8.8 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| modern-online | Velocity, modern forwarding, online mode | Paper 26.3, Paper 26.3 | 26.3 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| vanilla-online-direct | none (direct, online mode) | vanilla 1.20.4 | 1.20.4: pass | no session (offline client): refused as expected; rejected access token: refused as expected |

| Package | Commit | Result |
|---|---|---|
| mineflayer lint | `060b882` | passes |
| mineflayer unit | `060b882` | 98 passing |
| mineflayer types | `060b882` | passes |

The reviewer's protocol fixture (`audit-artifacts/astra-review-1e67f091/run-respawn.cjs` on 1.8.8, 1.12.2, 1.21.4 and 26.3) failed 3 of 4 at `1e67f091` in the review, with 26.3 passing, and passes with the fix. Its log is in `audit-artifacts/followup3/dev/r15-respawn`, with the development runs of this follow-up, which are not counted. The same review corrected the range of the server stall in AUDIT.md (Stalled example connections), from the jar-by-jar Netty checks in `audit-artifacts/followup3/dev/r15-autoread-range`; no run of this record depends on that correction.

## Follow-up at `858e6bb0`

`858e6bb0` changes only two internal tests (see AUDIT.md, Test isolation); the library and its dependencies are those of `060b882d`.

- **The failure:** the hosted CI runs at `15136195` failed `physics cancels the delayed respawn teleport reply when a transfer lands inside its delay` on 26.3. The test required exactly the reply 100 ms after writing the teleport. On Linux that window also held the bot's first falling `position` packet, at y 79.92, one tick of gravity below the reply.
- **The fix:** the test now takes its snapshot when the reply's `forcedMove` fires and requires no `tick_end` before the reply. It also counts `forcedMove` after the transfer begins, which makes it fail on 1.20.2–26.2 if the transfer no longer cancels the deferred reply. `teleports answers every teleport queued for a tick, in arrival order` had the same flaw with catch-up ticks and now takes its snapshot inside the tick.

The failure depends on Linux timer precision, so the Windows logs of this record cannot show it. The discriminating runs are development runs in `audit-artifacts/followup3/dev/r17-ci-26.3`, which are not counted:

- Linux Node.js 24, the CI's major version, in Docker:
  - the unchanged test failed 10 of 10;
  - the old and new files were run against library mutants that remove the transfer cancel or defer the 26.3 reply;
  - the fixed tests passed 20 loops on five versions and 40 runs on fully loaded CPUs.
- Windows: a forced 120 ms event-loop stall reproduces both old failures on 26.3, and the fixed tests pass with it.

*Correction:* the transfer check only fails without the cancel when the post-death teleport is answered before the transfer arrives. Before 26.3 this test still slept 100 ms for that, and with delayed, batched delivery it passed without the cancel. Fixed in `d3e13adf`; see the follow-up at `d3e13adf`.

The changed file was checked from a clean worktree whose logs name `858e6bb0` and its shrinkwrap's dependencies with the internal suite on all 30 versions and the companion checks below. The vanilla suites, the latency and Velocity runs, `digEverything`, the companion libraries and the real-account runs were not repeated: no library, harness or vanilla test changed.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 75 | 25 |
| 1.9.4 | 77 | 23 |
| 1.10.2 | 77 | 23 |
| 1.11.2 | 77 | 23 |
| 1.12.2 | 77 | 23 |
| 1.13.2 | 77 | 23 |
| 1.14.4 | 77 | 23 |
| 1.15.2 | 77 | 23 |
| 1.16.5 | 77 | 23 |
| 1.17.1 | 81 | 19 |
| 1.18.2 | 81 | 19 |
| 1.19 | 84 | 16 |
| 1.19.2 | 84 | 16 |
| 1.19.3 | 84 | 16 |
| 1.19.4 | 85 | 15 |
| 1.20.1 | 85 | 15 |
| 1.20.2 | 89 | 11 |
| 1.20.4 | 90 | 10 |
| 1.20.6 | 89 | 11 |
| 1.21.1 | 90 | 10 |
| 1.21.3 | 92 | 8 |
| 1.21.4 | 98 | 2 |
| 1.21.5 | 98 | 2 |
| 1.21.6 | 98 | 2 |
| 1.21.8 | 98 | 2 |
| 1.21.9 | 98 | 2 |
| 1.21.11 | 98 | 2 |
| 26.1 | 103 | 2 |
| 26.2 | 103 | 2 |
| 26.3 | 104 | 1 |

| Package | Commit | Result |
|---|---|---|
| mineflayer lint | `858e6bb` | passes |
| mineflayer unit | `858e6bb` | 98 passing |
| mineflayer types | `858e6bb` | passes |

## Follow-up at `d3e13adf`

`d3e13adf` changes only the transfer test of the previous follow-up (see AUDIT.md, Test isolation); the library and its dependencies are those of `060b882d`.

- **The gap:** a review of `5b340cc0` found that before 26.3 the test wrote the post-death teleport, slept 100 ms and started the transfer, without knowing whether a tick had deferred the reply yet. With the mock server's writes delivered late and together, the teleport and `start_configuration` arrived in one batch, leaving play dropped the queued teleport before any reply timer existed, and the test passed on 1.20.2–26.2 with the transfer's cancel removed.
- **The fix:** the bot writes `teleport_confirm` just before it defers the reply, so the test now waits for the server to receive the confirmation of that teleport, checks that no movement has been sent, and only then starts the transfer. Both checks after the transfer are unchanged.

The gap needs delayed, coalesced delivery, which the logs of this record do not have. The discriminating runs are development runs in `audit-artifacts/followup3/dev/r19-transfer-barrier`, which are not counted. With the same results on Windows Node.js 26 and Linux Node.js 24 in Docker, on 1.20.2, 1.21.1, 1.21.4, 26.2 and 26.3:

- the old test passes with the cancel removed under batched delivery;
- the new test fails it on 1.20.2–26.2 under normal and batched delivery, and fails a library that never defers on the new check;
- the 26.3 checks still reject a deferred 26.3 reply and two replies in one tick;
- the real plugin passes under both deliveries.

It also has Linux runs of the fixed tests in a loop and on fully loaded CPUs, and a stall check showing that the neighbouring login and respawn tests, which queue their teleport locally, do not share the gap.

The changed file was checked from a clean worktree whose logs name `d3e13adf` and its shrinkwrap's dependencies with the internal suite on all 30 versions and the companion checks below. Nothing else was repeated: no library, harness or vanilla test changed.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 75 | 25 |
| 1.9.4 | 77 | 23 |
| 1.10.2 | 77 | 23 |
| 1.11.2 | 77 | 23 |
| 1.12.2 | 77 | 23 |
| 1.13.2 | 77 | 23 |
| 1.14.4 | 77 | 23 |
| 1.15.2 | 77 | 23 |
| 1.16.5 | 77 | 23 |
| 1.17.1 | 81 | 19 |
| 1.18.2 | 81 | 19 |
| 1.19 | 84 | 16 |
| 1.19.2 | 84 | 16 |
| 1.19.3 | 84 | 16 |
| 1.19.4 | 85 | 15 |
| 1.20.1 | 85 | 15 |
| 1.20.2 | 89 | 11 |
| 1.20.4 | 90 | 10 |
| 1.20.6 | 89 | 11 |
| 1.21.1 | 90 | 10 |
| 1.21.3 | 92 | 8 |
| 1.21.4 | 98 | 2 |
| 1.21.5 | 98 | 2 |
| 1.21.6 | 98 | 2 |
| 1.21.8 | 98 | 2 |
| 1.21.9 | 98 | 2 |
| 1.21.11 | 98 | 2 |
| 26.1 | 103 | 2 |
| 26.2 | 103 | 2 |
| 26.3 | 104 | 1 |

| Package | Commit | Result |
|---|---|---|
| mineflayer lint | `d3e13ad` | passes |
| mineflayer unit | `d3e13ad` | 98 passing |
| mineflayer types | `d3e13ad` | passes |

## Follow-up at `7af17f87`

`7af17f87` pins the data release `java-26.3-data-11` and the companions rebuilt on it (minecraft-protocol `5307b49`; the commits are in AUDIT.md), and adds the test of the fix (see AUDIT.md, Sign items on 26.3). The release differs from `data-10` only in the 26.3 `sign_text_front` and `sign_text_back` item components, whose filtered messages are now optional, as `SignText.STREAM_CODEC` in the 26.3 server jar writes them (`ByteBufCodecs.optional` around the list of four). The archive's other files are identical to `data-10` apart from the generated protocol; the companion commits change only that pin, and minecraft-protocol adds a test that reads both layouts.

The new vanilla test `signItem` gives a 26.3 bot an oak sign with front text, and back text with filtered messages, colour and glowing text, followed by a stack of stone, and requires all of them to be read from the slot packets; before 26.3 it does nothing.

`suite-7af17f87` (server suites): The internal and vanilla suites on every version, including the new `signItem` test.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 145 | 25 |
| 1.9.4 | 147 | 23 |
| 1.10.2 | 147 | 23 |
| 1.11.2 | 147 | 23 |
| 1.12.2 | 147 | 23 |
| 1.13.2 | 147 | 23 |
| 1.14.4 | 147 | 23 |
| 1.15.2 | 147 | 23 |
| 1.16.5 | 147 | 23 |
| 1.17.1 | 153 | 19 |
| 1.18.2 | 153 | 19 |
| 1.19 | 156 | 16 |
| 1.19.2 | 156 | 16 |
| 1.19.3 | 156 | 16 |
| 1.19.4 | 157 | 15 |
| 1.20.1 | 158 | 15 |
| 1.20.2 | 162 | 11 |
| 1.20.4 | 163 | 10 |
| 1.20.6 | 162 | 11 |
| 1.21.1 | 163 | 10 |
| 1.21.3 | 165 | 8 |
| 1.21.4 | 171 | 2 |
| 1.21.5 | 171 | 2 |
| 1.21.6 | 171 | 2 |
| 1.21.8 | 171 | 2 |
| 1.21.9 | 172 | 2 |
| 1.21.11 | 172 | 2 |
| 26.1 | 177 | 2 |
| 26.2 | 177 | 2 |
| 26.3 | 179 | 1 |

`lag150-7af17f87` (server suites through the latency proxy, 150 ms each way): The vanilla suites through the latency proxy on the versions of the previous data follow-up.

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 70 | 0 |
| 1.12.2 | 70 | 0 |
| 1.21.11 | 74 | 0 |
| 26.3 | 75 | 0 |

| Package | Commit | Result |
|---|---|---|
| mineflayer lint | `7af17f8` | passes |
| mineflayer unit | `7af17f8` | 98 passing |
| mineflayer types | `7af17f8` | passes |
| minecraft-protocol lint | `5307b49` | passes |
| minecraft-protocol focused suites | `5307b49` | 1168 passing, 15 pending |
| minecraft-protocol packet round trip (32 versions) | `5307b49` | 5680 passing |
| minecraft-protocol server suite (32 versions) | `5307b49` | 384 passing |
| prismarine-chunk | `5f7f07c` | 333 passing |
| prismarine-physics | `39321ad` | 57 passing |
| prismarine-item | `13c7329` | 173 passing |
| minecraft-data schema and audit suite | `38fbd69` | 1906 passing, 1 pending |
| node-minecraft-data wrapper | `518e467` | 902 passing |

The clean application install (`consumer-check-7af17f87.log`) resolves one minecraft-data, `data-11` with the documented integrity, and one forked prismarine-item for every package; every package of the chain reads the optional filtered messages, and minecraft-protocol decodes a sign item as Spigot 26.3 writes it. The earlier checks of that script also passed. The baseline `signItem-baseline-r19` (listed under the attempts of this round) runs the new test with `data-10` and fails. Development material for this follow-up is in `audit-artifacts/followup3/dev/r20-sign-item` and is not counted: the `window_items` packet a Spigot 26.3 server sent for a menu with a sign icon (it fails to decode with `data-10` and decodes to its full length with `data-11`), and `signItem` on 26.2 and 26.3 from the development checkout.

## Attempts of this round

- `suite-d22e00df` (server suites, `d22e00df`): all 30 versions passed. Superseded: the nether test changed in `912e8ca2` after the first lag run.
- `internal-d22e00df` (internal suite, `d22e00df`): all 30 versions passed. Superseded by the run at `912e8ca2`.
- `lag150-d22e00df` (server suites through the latency proxy, 150 ms each way, `d22e00df`): 6 of 7 versions passed; failed: 26.3 (nether: Error: Server did not answer the placement at (-2, 33, -9): Event blockUpdate:(-2, 33, -9) did not fire within timeout of 5000ms). The 26.3 failure was a race in the nether test under latency, fixed in `912e8ca2` (see AUDIT.md).
- `suite-912e8ca2` (server suites, `912e8ca2`): all 30 versions passed.
- `internal-912e8ca2` (internal suite, `912e8ca2`): all 30 versions passed.
- `lag150-912e8ca2` (server suites through the latency proxy, 150 ms each way, `912e8ca2`): all 7 versions passed.
- `dig-912e8ca2-a` (`digEverything`, `912e8ca2`): all 15 versions passed.
- `dig-912e8ca2-b` (`digEverything`, `912e8ca2`): all 15 versions passed.
- `spawn-baseline-6a5c46bc` (vanilla `spawnEvent`, `6a5c46bc`): 1 of 5 versions passed; failed: 1.12.2 (spawnEvent: Error: the server refused a block activated on spawn), 1.21.3 (spawnEvent: Error: spawned facing nothing at undefined), 1.21.4 (spawnEvent: Error: the server refused a block activated on spawn), 26.3 (spawnEvent: Error: the server refused a block activated on spawn). Unfixed baseline (the library of `dd781b6a` with the tests of `cbcff236`): refusals are the bug; 1.21.3 failed before clicking because spawn there does not wait for terrain, which `ae0ed690` handles.
- `spawn-baseline-c999f2a3-a` (vanilla `spawnEvent`, `c999f2a3`): 2 of 7 versions passed; failed: 1.16.5 (spawnEvent: Error: the server refused a block activated on spawn), 1.20.1 (spawnEvent: Error: the server refused a block activated on spawn), 1.21.3 (spawnEvent: Error: the server refused a block activated on spawn), 1.21.4 (spawnEvent: Error: the server refused a block activated on spawn), 26.3 (spawnEvent: Error: the server refused a block activated on spawn). Unfixed baseline (the library of `dd781b6a` with the tests of `ae0ed690`), attempt 1 of 3: refusals are the bug.
- `spawn-baseline-c999f2a3-b` (vanilla `spawnEvent`, `c999f2a3`): 1 of 7 versions passed; failed: 1.12.2 (spawnEvent: Error: the server refused a block activated on spawn), 1.16.5 (spawnEvent: Error: the server refused a block activated on spawn), 1.20.1 (spawnEvent: Error: the server refused a block activated on spawn), 1.21.3 (spawnEvent: Error: the server refused a block activated on spawn), 1.21.4 (spawnEvent: Error: the server refused a block activated on spawn), 26.3 (spawnEvent: Error: the server refused a block activated on spawn). Unfixed baseline, attempt 2 of 3.
- `spawn-baseline-c999f2a3-c` (vanilla `spawnEvent`, `c999f2a3`): 1 of 7 versions passed; failed: 1.12.2 (spawnEvent: Error: the server refused a block activated on spawn), 1.16.5 (spawnEvent: Error: the server refused a block activated on spawn), 1.20.1 (spawnEvent: Error: the server refused a block activated on spawn), 1.21.3 (spawnEvent: Error: the server refused a block activated on spawn), 1.21.4 (spawnEvent: Error: the server refused a block activated on spawn), 26.3 (spawnEvent: Error: the server refused a block activated on spawn). Unfixed baseline, attempt 3 of 3.
- `spawn-baseline-ae5a64a9` (vanilla `spawnEvent`, `ae5a64a9`): 1 of 7 versions passed; failed: 1.12.2 (spawnEvent: Error: the server refused a block activated on spawn), 1.16.5 (spawnEvent: Error: the server refused a block activated on spawn), 1.20.1 (spawnEvent: Error: the server refused a block activated on spawn), 1.21.3 (spawnEvent: Error: the server refused a block activated on spawn), 1.21.4 (spawnEvent: Error: the server refused a block activated on spawn), 26.3 (spawnEvent: Error: the server refused a block activated on spawn). Unfixed baseline (the library of `dd781b6a` with the tests of `cb248a03`): refusals are the bug.
- `spawn-ae0ed690-a` (vanilla `spawnEvent`, `ae0ed690`): all 7 versions passed. Superseded by the runs at `cb248a03`, whose only change is the `spawnEvent` setup.
- `spawn-ae0ed690-b` (vanilla `spawnEvent`, `ae0ed690`): all 7 versions passed. Superseded by the runs at `cb248a03`.
- `spawn-ae0ed690-c` (vanilla `spawnEvent`, `ae0ed690`): all 7 versions passed. Superseded by the runs at `cb248a03`.
- `internal-ae0ed690` (internal suite, `ae0ed690`): all 30 versions passed. Superseded by the run at `cb248a03`.
- `suite-ae0ed690` (server suites, `ae0ed690`): all 30 versions passed. Superseded by the run at `cb248a03`.
- `lag150-ae0ed690` (server suites through the latency proxy, 150 ms each way, `ae0ed690`): 2 of 4 versions passed; failed: 1.8.8 (spawnEvent: Error: spawned facing nothing at undefined), 26.3 (furnace: Error: Server rejected). Superseded: the 1.8.8 failure was a hole an earlier test left under the new chest check (fixed in `cb248a03`); the 26.3 `furnace` failure was a bed item left by the `bed` test, picked up while a creative slot set was in flight (see VALIDATION.md).
- `drops-baseline-47822c10` (vanilla `resetState` tests, `47822c10`): 0 of 30 versions passed; failed: 1.10.2 (resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.11.2 (resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.9.4 (resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.8.8 (resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.12.2 (resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.13.2 (resetState removes a stack the test tossed: Error: Event entitySpawn did not fire within timeout of 5000ms), 1.14.4 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.15.2 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.16.5 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.17.1 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.18.2 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.19 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.19.2 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.20.1 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.19.4 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.19.3 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.20.2 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.20.4 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.20.6 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.1 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.3 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.4 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.5 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.6 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.8 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.9 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.11 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 26.1 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 26.2 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 26.3 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items). Superseded baseline: its helpers recognised dropped items only by the names `item` and `Item`, so on 1.13.2 (`item_stack`) the tossed stack was never seen and the bed item was missed; repeated as `drops-baseline-eea8cd5a` with the corrected helpers.
- `drops-baseline-eea8cd5a` (vanilla `resetState` tests, `eea8cd5a`): 0 of 30 versions passed; failed: 1.10.2 (resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.9.4 (resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.11.2 (resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.8.8 (resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.12.2 (resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.13.2 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.14.4 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.15.2 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.16.5 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.17.1 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.18.2 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.19 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.19.2 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.19.3 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.20.1 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.19.4 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.20.2 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.20.4 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.20.6 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.1 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.3 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.4 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.5 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.6 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.8 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.9 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 1.21.11 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 26.1 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 26.2 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items), 26.3 (resetState removes the item its own fills drop: AssertionError [ERR_ASSERTION]: the reset left dropped items; resetState removes a stack the test tossed: AssertionError [ERR_ASSERTION]: the reset left dropped items). Baseline: the reset of `edb5d2b5` with the `resetState` tests of `bbb2c2c7`, at a commit made only for it. Every failure is the test finding a dropped item after the reset, which is the bug.
- `lag150-bbb2c2c7` (server suites through the latency proxy, 150 ms each way, `bbb2c2c7`): 2 of 4 versions passed; failed: 26.3 (time: AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:), 1.12.2 (time: AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:). Superseded by `ff4ad5b0`: `time` failed on 1.12.2 and 26.3 because the new `resetState` test had set the time near 18000 just before it, and the test did not wait for its gamerule (see the follow-up at `ff4ad5b0`).
- `droppedItem-baseline-1a56b7bd` (vanilla `droppedItem` test, `1a56b7bd`): 29 of 30 versions passed; failed: 1.8.8 (droppedItem: TypeError: Cannot read properties of undefined (reading 'present')). Baseline: the library and data (`data-9`) of `5b8123d8` with the tests of `16fd831a`, at a commit made only for it. The 1.8.8 failure, `getDroppedItem()` throwing, is the bug; the other 29 versions read the stack at their key.
- `internal-baseline-448dbbb8` (internal suite, `448dbbb8`): 0 of 5 versions passed; failed: 1.12.2 (mineflayer_internal 1.12.2v: AssertionError [ERR_ASSERTION]: teleport replies: [[1.5,66,1.5],[3.5,80,3.5]]; mineflayer_internal 1.12.2v: AssertionError [ERR_ASSERTION]: position_look heights), 1.8.8 (mineflayer_internal 1.8.8v: AssertionError [ERR_ASSERTION]: a superseded deferred reply still holds back actions waiting for teleport confirmations; mineflayer_internal 1.8.8v: AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:), 1.21.3 (mineflayer_internal 1.21.3v: AssertionError [ERR_ASSERTION]: teleport replies: [[1.5,66,1.5],[3.5,80,3.5]]; mineflayer_internal 1.21.3v: AssertionError [ERR_ASSERTION]: position_look heights), 1.21.4 (mineflayer_internal 1.21.4v: AssertionError [ERR_ASSERTION]: teleport replies: [[1.5,66,1.5],[3.5,80,3.5]]; mineflayer_internal 1.21.4v: AssertionError [ERR_ASSERTION]: position_look heights; mineflayer_internal 1.21.4v: TypeError: Cannot read properties of null (reading 'position'); mineflayer_internal 1.21.4v: Error: done() called multiple times in test <mineflayer_internal 1.21.4v spawn after the teleport confirmation teleports that move the player into another chunk column on 1.21.4+ waits for the column under the latest confirmed teleport> of file C:\Users\blake\Desktop\Min; mineflayer_internal 1.21.4v: AssertionError [ERR_ASSERTION]: spawn announced 55 ms after the wait began; the fallback is 3000 ms; mineflayer_internal 1.21.4v: AssertionError [ERR_ASSERTION]: spawn announced over a column that has not loaded), 26.3 (mineflayer_internal 26.3v: TypeError: Cannot read properties of null (reading 'position'); mineflayer_internal 26.3v: Error: done() called multiple times in test <mineflayer_internal 26.3v spawn after the teleport confirmation teleports that move the player into another chunk column on 1.21.4+ waits for the column under the latest confirmed teleport> of file C:\Users\blake\Desktop\Minecra; mineflayer_internal 26.3v: AssertionError [ERR_ASSERTION]: spawn announced 119 ms after the wait began; the fallback is 3000 ms; mineflayer_internal 26.3v: AssertionError [ERR_ASSERTION]: spawn announced over a column that has not loaded). Baseline: the library of `c5fc650d` with the tests of `973fe4fa`, at a commit made only for it, on 1.8.8, 1.12.2, 1.21.3, 1.21.4 and 26.3. Every failure is a new test: the two same-tick deferred reply tests on every version before 26.3, and three of the four column tests on 1.21.4 and 26.3; the guards pass.
- `suite-973fe4fa` (server suites, `973fe4fa`): 29 of 30 versions passed; failed: 1.21.3 (placeEntity place armor stand: Error: Failed to place entity; useChests: Error: Server refused to place chest at (0, -60, 1): the block is still air). Superseded by `6282be0f`: 29 versions passed; on 1.21.3 `placeEntity place armor stand` and `useChests` were refused because a chicken from a chicken jockey hatched by the summon egg test stood where they place (fixed in `6282be0f`, see AUDIT.md, Test isolation).
- `suite-6282be0f` (server suites, `6282be0f`): 29 of 30 versions passed; failed: 1.15.2 (exampleInventory: Error: examples/inventory.js exited before the test finished (code 1, signal null)). Not accepted: 29 versions passed; on 1.15.2 `examples/inventory.js` exited when its `waitForChunksToLoad()` after the test's `/tp` timed out waiting for 25 chunks, as `exampleBee` once did on 1.12.2 in the first follow-up; the example bot did not die and 1.15.2 has no terrain wait, so neither changed code path ran. The suites were run again at the same commit (`suite-6282be0f-b`). The cause was established afterwards: the vanilla server had stopped reading the example's connection when it switched it to play, so it never handled the confirmation of the `/tp` and never moved the example's chunk view (see AUDIT.md, Stalled example connections).
- `suite-6282be0f-b` (server suites, `6282be0f`): 29 of 30 versions passed; failed: 1.17.1 (nether: Error: Server refused to place warped_sign at (0, 128, 0): the block is still brown_mushroom). Superseded by `8ffb2d8d`: 29 versions passed, 1.15.2 and 1.21.3 included; on 1.17.1 `nether` was refused its sign because the generated nether roof had a brown mushroom where the sign goes (fixed in `8ffb2d8d`, see AUDIT.md, Test isolation).
- `internal-baseline-c7e2a2dd` (internal suite, `c7e2a2dd`): 1 of 5 versions passed; failed: 1.8.8 (mineflayer_internal 1.8.8v: AssertionError [ERR_ASSERTION]: a respawn leaves the deferred reply owed), 1.12.2 (mineflayer_internal 1.12.2v: AssertionError [ERR_ASSERTION]: teleport replies: [[3.5,80,3.5]]), 1.21.3 (mineflayer_internal 1.21.3v: AssertionError [ERR_ASSERTION]: teleport replies: [[3.5,80,3.5]]), 1.21.4 (mineflayer_internal 1.21.4v: AssertionError [ERR_ASSERTION]: teleport replies: [[3.5,80,3.5]]). Baseline: the physics plugin of `1e67f091` with the test of `060b882d`, at a commit made only for it, on 1.8.8, 1.12.2, 1.21.3, 1.21.4 and 26.3. The only failure is the new respawn test, on every version before 26.3; 26.3 never defers the reply and passes.
- `signItem-baseline-r19` (undefined, `f21b8dae`): 0 of 1 versions passed; failed: 26.3 (signItem: AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:; "after all" hook for "exampleInventory": Error: 1 packet(s) could not be decoded:). Baseline: `8d992ad5` (data-10) with the `signItem` test of `7af17f87`, at a commit made only for it, on 26.3. The test fails, and the harness reports the slot packet it could not decode.

## Failures investigated

Failures of earlier rounds and their fixes are described in AUDIT.md and in the superseded records of this file.

- The first lag run (`lag150-d22e00df`) failed `nether` on 26.3: the server sent the arrival position a second time after the client reported it had loaded, the test took that late packet for the reply to its `/tp 0 128 0`, and placed its sign against a block that the real teleport then left 96 blocks away, which the server ignored ("Server did not answer the placement"). The bot's packet trace shows the sequence. `912e8ca2` makes the test wait for the teleport to its target; because that changed a test, the server-suite and internal matrices were rerun at that commit too, and the `d22e00df` runs, otherwise clean, are kept as history.
- Development runs before the evidence runs (in `audit-artifacts/followup3/dev`, not counted): a first run of the 26.3 suites through the latency proxy failed only `creative`, whose bound on three confirmed slot sets assumed a local round trip (now allowed one round trip each); `toolSpeeds` with the old data-8 failed 5 of 7 cases on 26.3 and 2 of 5 on 1.21.4, as intended; and `exampleDigger` passed on 1.21.3 with the server slowed to 8 and to 3 ticks per second, so the failure of the second follow-up was not reproduced.

This covers the listed test points, not every patch release.

## Matrix

| Java version | Internal passing | Internal pending | Internal + vanilla passing | Internal + vanilla pending | digEverything passing |
|---|---:|---:|---:|---:|---:|
| 1.8.8 | 65 | 20 | 131 | 20 | 150 |
| 1.9.4 | 67 | 18 | 133 | 18 | 160 |
| 1.10.2 | 67 | 18 | 133 | 18 | 160 |
| 1.11.2 | 67 | 18 | 133 | 18 | 182 |
| 1.12.2 | 67 | 18 | 133 | 18 | 200 |
| 1.13.2 | 67 | 18 | 133 | 18 | 547 |
| 1.14.4 | 67 | 18 | 133 | 18 | 624 |
| 1.15.2 | 67 | 18 | 133 | 18 | 628 |
| 1.16.5 | 67 | 18 | 133 | 18 | 707 |
| 1.17.1 | 71 | 14 | 139 | 14 | 838 |
| 1.18.2 | 71 | 14 | 139 | 14 | 838 |
| 1.19 | 74 | 11 | 142 | 11 | 873 |
| 1.19.2 | 74 | 11 | 142 | 11 | 873 |
| 1.19.3 | 74 | 11 | 142 | 11 | 873 |
| 1.19.4 | 75 | 10 | 143 | 10 | 873 |
| 1.20.1 | 75 | 10 | 144 | 10 | 943 |
| 1.20.2 | 78 | 7 | 147 | 7 | 943 |
| 1.20.4 | 79 | 6 | 148 | 6 | 943 |
| 1.20.6 | 78 | 7 | 147 | 7 | 943 |
| 1.21.1 | 79 | 6 | 148 | 6 | 1000 |
| 1.21.3 | 81 | 4 | 150 | 4 | 1000 |
| 1.21.4 | 83 | 2 | 152 | 2 | 1034 |
| 1.21.5 | 83 | 2 | 152 | 2 | 1041 |
| 1.21.6 | 83 | 2 | 152 | 2 | 1042 |
| 1.21.8 | 83 | 2 | 152 | 2 | 1042 |
| 1.21.9 | 83 | 2 | 153 | 2 | 1103 |
| 1.21.11 | 83 | 2 | 153 | 2 | 1103 |
| 26.1 | 88 | 2 | 158 | 2 | 1105 |
| 26.2 | 88 | 2 | 158 | 2 | 1133 |
| 26.3 | 89 | 1 | 160 | 1 | 1223 |
