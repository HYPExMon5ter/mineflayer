# Validation record

Executed locally on 2026-10-21/22 with Windows, Node.js v26.12.0 and Java 25. See [AUDIT.md](AUDIT.md) for scope, exclusions, dependency revisions and limitations. The [machine-readable record](validation-results.json) includes SHA-256 hashes of the local logs, not the logs themselves.

- Final internal protocol-server matrix: **2242 passing, 263 pending, zero failures across 30 versions**. Pending tests are existing version/feature skips.
- Standalone unit/regression suite: **59 passing**.
- Vanilla external suites: successful executions for **all 30 test points**. Both endpoint suites include 56 external tests; the table below records combined internal + external passing totals from each selected server run.
- Companion suites: minecraft-data wrapper 902 passing; prismarine-chunk 333 passing; prismarine-physics 50 passing; protocol focused serialization/isolation/login suite 17 passing. These are local results.
- Full source/Markdown lint, consumer API typecheck, workflow YAML parse and git whitespace checks passed. Full dependency declaration checking remains failing as documented in AUDIT.md.
- Clean consumer install without root overrides passed. The nearest minecraft-data for Mineflayer, protocol, chunk, physics, registry, item and block all contains the corrected 26.3 sign schema; real serializer/deserializer sign round trip passed. Package contents use an explicit allowlist.
- npm audit snapshot: 29 total findings in the development graph (9 high, 19 moderate, 1 low); a clean runtime consumer reports 6 moderate findings. Not represented as fixed.

## Matrix

| Java version | Final internal passing | Internal pending | Selected internal + vanilla run passing | Vanilla outcome |
|---|---:|---:|---:|---|
| 1.8.8 | 64 | 19 | 120 | Pass |
| 1.9.4 | 66 | 17 | 110 | Pass |
| 1.10.2 | 66 | 17 | 110 | Pass |
| 1.11.2 | 66 | 17 | 110 | Pass |
| 1.12.2 | 66 | 17 | 110 | Pass |
| 1.13.2 | 66 | 17 | 110 | Pass |
| 1.14.4 | 66 | 17 | 110 | Pass |
| 1.15.2 | 66 | 17 | 119 | Pass |
| 1.16.5 | 66 | 17 | 119 | Pass |
| 1.17.1 | 70 | 13 | 122 | Pass |
| 1.18.2 | 70 | 13 | 122 | Pass |
| 1.19 | 73 | 10 | 125 | Pass |
| 1.19.2 | 73 | 10 | 125 | Pass |
| 1.19.3 | 73 | 10 | 129 | Pass |
| 1.19.4 | 74 | 9 | 130 | Pass |
| 1.20.1 | 74 | 9 | 130 | Pass |
| 1.20.2 | 77 | 6 | 133 | Pass |
| 1.20.4 | 78 | 5 | 134 | Pass |
| 1.20.6 | 77 | 6 | 133 | Pass |
| 1.21.1 | 78 | 5 | 134 | Pass |
| 1.21.3 | 80 | 3 | 136 | Pass |
| 1.21.4 | 82 | 1 | 138 | Pass |
| 1.21.5 | 82 | 1 | 138 | Pass |
| 1.21.6 | 82 | 1 | 138 | Pass |
| 1.21.8 | 82 | 1 | 138 | Pass |
| 1.21.9 | 82 | 1 | 138 | Pass |
| 1.21.11 | 82 | 1 | 138 | Pass |
| 26.1 | 87 | 1 | 143 | Pass |
| 26.2 | 87 | 1 | 143 | Pass |
| 26.3 | 87 | 1 | 143 | Pass |

## Failures investigated before the selected runs

The initial broad server matrix timed out in Nether tests on 1.21.5, 1.21.9 and 26.2. The preceding cooldown test left an ender pearl airborne; when it landed during the Nether test it teleported the owner back across dimensions. The cooldown fixture now kills the projectile in finally and waits for server confirmation. The portal fixture also acknowledges arrival before a second teleport and bounds its terrain wait with a dimension/position diagnostic. An attempted exit-portal-clearing workaround was removed after identifying the actual cause. Focused reproductions and complete affected suites were rerun; earlier failing runs were not counted as passes.

Fresh modern servers also closed status connections while idle. Disabling empty-server pausing in the isolated test harness restored status/login and the complete 26.2/26.3 suites. Existing user servers were not changed.

The 30-version final internal matrix ran after all runtime changes. Earlier successful vanilla executions were retained where later changes only affected the harness; both endpoints and affected modern versions were rerun. This is coverage of the listed test points, not every patch release. Hosted CI status is separate and must be checked for the published commit.
