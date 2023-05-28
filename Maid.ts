// Packages
import {GetUniqueId} from './UniqueId'
import {Signal, Event, Connection, IsConnection} from './Signal'

// Local Types
type Callback = (() => void)

// Signal Types
type DestroyingSignal = (() => void)
type CleanedSignal = (() => void)
type DestroyedSignal = (() => void)

// Maid Types
type Item = (Maid | Callback | MutationObserver | ResizeObserver | Connection<any> | HTMLElement)

// Class
class Maid {
	// Private Properties
	private Items: Map<any, Item>
	private DestroyedState: boolean

	// Signals
	private DestroyingSignal: Signal<DestroyingSignal>
	private CleanedSignal: Signal<CleanedSignal>
	private DestroyedSignal: Signal<DestroyedSignal>

	// Events
	public Destroying: Event<DestroyingSignal>
	public Cleaned: Event<CleanedSignal>
	public Destroyed: Event<DestroyedSignal>

	// Constructor
	constructor() {
		// Create our list of items
		this.Items = new Map()

		// Store our initial destroyed state
		this.DestroyedState = false

		// Create our signals/events
		{
			// Signals
			this.DestroyingSignal = new Signal()
			this.CleanedSignal = new Signal()
			this.DestroyedSignal = new Signal()

			// Events
			this.Destroying = this.DestroyingSignal.GetEvent()
			this.Cleaned = this.CleanedSignal.GetEvent()
			this.Destroyed = this.DestroyedSignal.GetEvent()
		}
	}

	// Private Methods
	private CleanItem<T extends Item>(item: T) {
		// Check if we're a maid
		if (item instanceof Maid) {
			item.Destroy()
		} else if ((item instanceof MutationObserver) || (item instanceof ResizeObserver)) {
			item.disconnect()
		} else if (IsConnection(item)) {
			item.Disconnect()
		} else if(item instanceof HTMLElement) {
			item.remove()
		} else {
			item()
		}
	}

	// Public Methods
	public Give<T extends Item>(item: T, key?: any): T {
		// If we're already destroyed then we can just clean the item immediately
		if (this.Destroyed) {
			this.CleanItem(item)

			return item
		}

		// Determine our final-key
		const finalKey = (key || GetUniqueId())

		// Now store ourselves
		this.Items.set(finalKey, item)

		// Return our item for ease-of-use
		return item
	}

	public GiveItems<T extends Item>(items: T[]): T[] {
		// Loop through all of our items
		for (const item of items) {
			// Give the item
			this.Give(item)
		}

		// Return back our items
		return items
	}

	public Has(key: any): boolean {
		return this.Items.has(key)
	}

	public Clean(key: any) {
		// First determine if we have the item
		const item = this.Items.get(key)

		if (item !== undefined) {
			// Remove the key
			this.Items.delete(key)

			// Clean the item
			this.CleanItem(item)
		}
	}

	public CleanUp() {
		// Loop through all of our items
		for (const key of this.Items) {
			// Clean the item
			this.Clean(key)
		}

		// Make sure we aren't destroyed prior to firing
		if (this.DestroyedState === false) {
			this.CleanedSignal.Fire()
		}
	}

	public IsDestroyed() {
		return this.DestroyedState
	}

	// Deconstructor
	public Destroy() {
		// Make sure we don't perform twice
		if (this.DestroyedState === false) {
			// Set our destroyed state
			this.DestroyedState = true

			// Fire our Destroying signal
			this.DestroyingSignal.Fire()

			// Clean out all our items
			this.CleanUp()

			// Now force remove our map
			delete (this as any).Items

			// Fire our destroyed signal
			this.DestroyedSignal.Fire()

			// Now destroy all our signals
			this.DestroyingSignal.Destroy()
			this.CleanedSignal.Destroy()
			this.DestroyedSignal.Destroy()

			// Force remove our signal references
			delete (this as any).DestroyingSignal
			delete (this as any).CleanedSignal
			delete (this as any).DestroyedSignal
		}
	}
}

// Export our maid class
export {Maid}