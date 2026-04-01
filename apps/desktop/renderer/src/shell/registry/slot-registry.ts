import type { ComponentType } from 'react'

class SlotRegistry {
  private slots = new Map<string, ComponentType[]>()

  register(slotName: string, component: ComponentType): void {
    const existing = this.slots.get(slotName) ?? []
    this.slots.set(slotName, [...existing, component])
  }

  getAll(slotName: string): ComponentType[] {
    return this.slots.get(slotName) ?? []
  }
}

export const slotRegistry = new SlotRegistry()
