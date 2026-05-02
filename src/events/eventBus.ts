import { ref } from 'vue';

// Simple event bus for permission changes
type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
}

export const eventBus = new EventBus();

// Permission change events
export const PERMISSION_EVENTS = {
  PERMISSIONS_CHANGED: 'permissions:changed',
  ROLE_PERMISSIONS_UPDATED: 'role-permissions:updated',
  USER_PERMISSIONS_REFRESHED: 'user-permissions:refreshed',
} as const;
