/**
 * Shared setup for probing Baz against the live model.
 *
 * Exists because of what it cost not to have it. Diagnosing a truncation bug took roughly
 * twenty-five replays, each one an ordinary anonymous session with a case of its own, and the
 * capacity cap counts customer cases created in the last 24 hours. The probes used the day's
 * allowance up, and the product started telling real visitors the demonstration was at capacity
 * because of automated runs nobody was watching.
 *
 * Two rules, both enforced here rather than remembered:
 *
 *   1. A probe case is tagged `test` the moment it exists, which takes it out of the count.
 *   2. It is deleted when the probe finishes, including when the probe throws or is killed.
 *
 * Rule 2 is the hygiene and rule 1 is the guarantee. A probe that is killed mid-run — which
 * happened twice in one morning — still leaks a case, and rule 1 means a leaked case costs
 * nothing but a row.
 *
 * Live probing is the exception, not the default. Reach for the live model only to check what
 * the model itself does: token counts, tool-calling and truncation are that; layout and copy are
 * not. For those, `LLM_PROVIDER=fixture` replays a script and costs nothing; this file is for
 * the cases where only the real model will do.
 */

import fs from 'node:fs'

const ROOT = new URL('..', import.meta.url).pathname

const parseEnvFile = (file) =>
  Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => line.includes('=') && !line.startsWith('#'))
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()]),
  )

export const env = parseEnvFile(`${ROOT}.env`)
export const adminCredentials = parseEnvFile(`${ROOT}.admin-credentials`)

/** Signs a page in to the admin console, which is what authorises tagging and deleting. */
export async function signInAsAdmin(page, baseUrl = 'http://localhost:5173') {
  await page.goto(`${baseUrl}/#/admin`, { waitUntil: 'load' })
  await page.fill('input[type=email]', adminCredentials.EMAIL)
  await page.fill('input[type=password]', adminCredentials.PASSWORD)
  await page.click('button:has-text("Sign in")')
  await page.waitForTimeout(6000)
}

/** Calls an admin action from an already signed-in page. */
export function callAdmin(adminPage, body) {
  return adminPage.evaluate(
    async ({ url, key, body }) => {
      const { supabase } = await import('/src/lib/supabase.ts')
      const session = await supabase.auth.getSession()
      const response = await fetch(`${url}/functions/v1/admin`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.data.session.access_token}`,
          apikey: key,
        },
        body: JSON.stringify(body),
      })
      return await response.json()
    },
    { url: env.VITE_SUPABASE_URL, key: env.VITE_SUPABASE_ANON_KEY, body },
  )
}

/**
 * Tracks every case a probe creates, tags each one out of the capacity count, and deletes them
 * all when the run ends — on success, on an exception, and on Ctrl-C.
 */
export function caseTracker(adminPage) {
  const created = new Set()
  let cleaning = false

  const cleanUp = async () => {
    if (cleaning) return
    cleaning = true
    for (const caseId of created) {
      await callAdmin(adminPage, { action: 'delete_case', caseId }).catch(() => undefined)
    }
    created.clear()
  }

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      void cleanUp().finally(() => process.exit(130))
    })
  }

  return {
    /** Call as soon as a probe case exists. Tagging is what makes a leak harmless. */
    track: async (caseId) => {
      created.add(caseId)
      const result = await callAdmin(adminPage, { action: 'tag_test_case', caseId })
      if (!result?.ok) throw new Error(`Could not tag ${caseId} as a test case.`)
    },
    cleanUp,
  }
}
