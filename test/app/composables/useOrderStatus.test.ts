import { describe, it, expect } from 'vitest'
import {
  useOrderStatus,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_VALUES,
} from '~/composables/useOrderStatus'

describe('useOrderStatus', () => {
  const status = useOrderStatus()

  it('maps known statuses to Romanian labels', () => {
    expect(status.label('processing')).toBe('In procesare')
    expect(status.label('shipped')).toBe('Expediata')
    expect(status.label('completed')).toBe('Finalizata')
  })

  it('falls back to the raw status string for unknown labels', () => {
    expect(status.label('archived')).toBe('archived')
  })

  it('maps known statuses to badge colors', () => {
    expect(status.color('processing')).toBe('warning')
    expect(status.color('completed')).toBe('success')
    expect(status.color('cancelled')).toBe('error')
  })

  it('falls back to neutral for unknown colors', () => {
    expect(status.color('archived')).toBe('neutral')
  })

  it('exposes every status value with a matching label and color', () => {
    expect(status.values).toEqual(ORDER_STATUS_VALUES)
    for (const value of ORDER_STATUS_VALUES) {
      expect(ORDER_STATUS_LABEL[value]).toBeTypeOf('string')
      expect(ORDER_STATUS_COLOR[value]).toBeTypeOf('string')
    }
  })
})
