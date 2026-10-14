/**
 * Counts the build, from the repository rather than from memory.
 *
 * The page states how long this took and how many commits it was, and those are the easiest
 * numbers on it to be quietly wrong about: the first version of the content said nine days and
 * 143 commits, which were true when somebody wrote them down and are not true now. A figure
 * that decays silently is worse than no figure, because nobody re-checks a number that already
 * looks specific.
 *
 * Run: node scripts/build-metrics.mjs
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'

const ROOT = new URL('..', import.meta.url).pathname

const git = (command) => execSync(`git ${command}`, { cwd: ROOT, encoding: 'utf8' }).trim()

const commits = Number(git('rev-list --count HEAD'))
const dates = git("log --format=%ad --date=short").split('\n').filter(Boolean)

const first = dates[dates.length - 1]
const last = dates[0]

/** Days somebody actually committed, which is the honest measure of effort. */
const workingDays = new Set(dates).size

/** Calendar days from the first commit to the most recent, inclusive. */
const elapsedDays =
  Math.round((new Date(last).getTime() - new Date(first).getTime()) / 86_400_000) + 1

const metrics = {
  commits,
  workingDays,
  elapsedDays,
  firstCommit: first,
  lastCommit: last,
  /**
   * The pivots are a judgement, not a count of anything, so they stay in the content file
   * beside the story they belong to. Changing one means rewriting a paragraph anyway.
   */
  measuredAt: new Date().toISOString().slice(0, 10),
}

const path = `${ROOT}src/content/how-it-works/build-metrics.json`
fs.mkdirSync(`${ROOT}src/content/how-it-works`, { recursive: true })
fs.writeFileSync(path, `${JSON.stringify(metrics, null, 2)}\n`)

console.log(
  `${String(commits)} commits over ${String(workingDays)} working days (${first} to ${last})`,
)
console.log(`written to ${path}`)
