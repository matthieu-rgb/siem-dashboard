import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Agents from './Agents'

describe('Agents', () => {
  it('renders stub message', () => {
    render(<Agents />)
    expect(screen.getByText(/no agents yet/i)).toBeInTheDocument()
    expect(screen.getByText(/phase 3/i)).toBeInTheDocument()
  })
})
