export class State<T = any> {
  private subscriptions: ((current: T) => void)[] = []

  constructor(public current: T) {}

  set(update: T) {
    this.subscriptions.map((fn) => fn(update))
    this.current = update
  }

  subscribe(fn: (current: T) => void) {
    this.subscriptions.push(fn)
  }

  unsubscribe(fn: (current: T) => void) {
    const i = this.subscriptions.indexOf(fn)
    if (i !== -1) {
      this.subscriptions.splice(i, 1)
    }
  }
}
