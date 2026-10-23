# Validation record

Executed locally on 2026-10-23 with Windows, Node.js 26.12.1 and Java 25 (OpenJDK 25.0.3). See [AUDIT.md](AUDIT.md) for scope, exclusions, dependency revisions and limitations. The [machine-readable record](validation-results.json) lists every attempt of this round, failed ones included, with its exit status and the SHA-256 of its log; the logs themselves are local and not published.

This record replaces the one for `a26a40f9` (the second follow-up), which is superseded, not rewritten; its text and record remain in the history of this file. It covers Mineflayer `912e8ca2` with the dependency revisions it pins (those in AUDIT.md, except minecraft-protocol `41e6cd2`), installed from the pinned published commits and the `java-26.3-data-9` release. Every Mineflayer log of this round's matrices ran that one commit from a separate clean worktree; companion logs each name their clean commit. The follow-up `ec5885d6`, which pins minecraft-protocol `005d953`, was checked with the targeted runs under [Follow-up at `ec5885d6`](#follow-up-at-ec5885d6).

## Evidence format

Every attempt runs into a new run directory and is never overwritten, so a rerun sits next to the attempt it repeats. Each Mineflayer log starts with a header naming `MC_VERSION`, the kind of run, the proxy latency, the commit, Node.js, Java and every installed companion archive or commit with its integrity, and ends with the process exit status; companion logs name their repository commit, the installed minecraft-data archive and the exit status. The generator (`write-validation.js`) refuses a run directory the manifest does not list, a log whose hash, exit status or counts differ from its record, any header whose dependencies differ from the evidence commit's `npm-shrinkwrap.json`, and duplicate logs; it accepts only an attempt that exited 0 with no failing test and no undecodable packet, needs one for every version and kind, and records every other attempt as history. Its own checks are tested on altered copies of the evidence (`test-write-validation.js`).

## Hosted CI

Hosted CI [39976149433](https://github.com/HYPExMon5ter/mineflayer/actions/runs/39976149433) passed at `ee776144` on 2026-10-23: all 30 Minecraft test versions, lint, and Node.js 22/24 unit and type checks, with the required gate green. This published commit includes the second and third follow-ups and the real signed-chat ordering fix. The earlier baseline run [39754758116](https://github.com/HYPExMon5ter/mineflayer/actions/runs/39754758116) also passed at `ffc2bb45`.

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

The account owner signed in with a real Microsoft account once, with the device code flow; every later run reused that cached session through Mineflayer's normal `auth: 'microsoft'` login (`audit-artifacts/live-auth/run.js`). Each run starts a fresh vanilla server with `online-mode=true` and `enforce-secure-profile=true` on loopback; the server's authenticator verifies the account, the bot must spawn, and its chat must come back as signed player chat, which the server logs without a "Not Secure" mark. Result files record packet names, times and booleans only, no keys, signatures or tokens. Every attempt, failed ones included (51):

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

## Attempts of this round

- `suite-d22e00df` (server suites, `d22e00df`): all 30 versions passed. Superseded: the nether test changed in `912e8ca2` after the first lag run.
- `internal-d22e00df` (internal suite, `d22e00df`): all 30 versions passed. Superseded by the run at `912e8ca2`.
- `lag150-d22e00df` (server suites through the latency proxy, 150 ms each way, `d22e00df`): 6 of 7 versions passed; failed: 26.3 (nether: Error: Server did not answer the placement at (-2, 33, -9): Event blockUpdate:(-2, 33, -9) did not fire within timeout of 5000ms). The 26.3 failure was a race in the nether test under latency, fixed in `912e8ca2` (see AUDIT.md).
- `suite-912e8ca2` (server suites, `912e8ca2`): all 30 versions passed.
- `internal-912e8ca2` (internal suite, `912e8ca2`): all 30 versions passed.
- `lag150-912e8ca2` (server suites through the latency proxy, 150 ms each way, `912e8ca2`): all 7 versions passed.
- `dig-912e8ca2-a` (`digEverything`, `912e8ca2`): all 15 versions passed.
- `dig-912e8ca2-b` (`digEverything`, `912e8ca2`): all 15 versions passed.

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
