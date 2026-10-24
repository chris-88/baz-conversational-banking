import { describe, expect, it } from 'vitest'
import { route, TOOLS, toolResult, type JsonRpcRequest } from './protocol.ts'

const req = (method: string, params?: unknown, id: string | number = 1): JsonRpcRequest => ({
  jsonrpc: '2.0',
  id,
  method,
  ...(params === undefined ? {} : { params }),
})

const never = () => Promise.reject(new Error('should not be called'))

describe('the protocol surface', () => {
  it('initialises with the version, the tools capability and the instructions', async () => {
    const response = await route(req('initialize'), never)
    expect(response).toMatchObject({ id: 1, result: { protocolVersion: '2025-06-18', serverInfo: { name: 'baz' } } })
    expect(JSON.stringify(response)).toContain('synthetic')
  })

  it('lists four tools with JSON Schema inputs', async () => {
    const response = await route(req('tools/list'), never)
    expect(response).toMatchObject({ result: { tools: TOOLS } })
    expect(TOOLS.map((tool) => tool.name)).toEqual(['baz_start', 'baz_say', 'baz_act', 'baz_status'])
    for (const tool of TOOLS) expect(tool.inputSchema).toHaveProperty('type', 'object')
  })

  it('answers a notification with nothing and a missing id with an error', async () => {
    expect(await route({ jsonrpc: '2.0', method: 'notifications/initialized' }, never)).toBeNull()
    expect(await route({ jsonrpc: '2.0', method: 'ping' }, never)).toMatchObject({ error: { code: -32600 } })
  })

  it('validates a tool call against its schema before the handler sees it', async () => {
    const bad = await route(req('tools/call', { name: 'baz_say', arguments: { handle: 'short', message: '' } }), never)
    expect(bad).toMatchObject({ result: { isError: true } })
    const unknown = await route(req('tools/call', { name: 'baz_fly', arguments: {} }), never)
    expect(unknown).toMatchObject({ error: { code: -32601 } })
  })

  it('hands a valid call to the handler with the parsed input', async () => {
    const seen: unknown[] = []
    const response = await route(
      req('tools/call', { name: 'baz_act', arguments: { action: 'decide_plan', handle: 'h'.repeat(20), planId: '11111111-2222-4333-8444-555555555555', decision: 'keep' } }),
      (name, input) => {
        seen.push(name, input)
        return Promise.resolve(toolResult('kept', { kept: true }))
      },
    )
    expect(seen[0]).toBe('baz_act')
    expect(seen[1]).toMatchObject({ action: 'decide_plan', decision: 'keep' })
    expect(response).toMatchObject({ result: { structuredContent: { kept: true } } })
  })
})
