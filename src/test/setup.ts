import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * Testing Library registers its own cleanup through a global `afterEach`, which only exists
 * when Vitest runs with `globals: true`. This project imports `describe`/`it`/`expect`
 * explicitly, so the automatic hook never fires and rendered DOM would accumulate across
 * tests in a file. Register it by hand.
 */
afterEach(cleanup)
