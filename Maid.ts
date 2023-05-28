// Packages
import {GetUniqueId} from './UniqueId'

// Local Types
type Callback = (() => void)

// Class
class Maid {
	private Items: Map<any, (Maid | Callback)>
	private Destroyed: boolean

	// Constructor
	constructor() {
		// Create our list of items
		this.Items = new Map()

		// Store our initial destroyed state
		this.Destroyed = false
	}

	// Private Methods
	private CleanItem<T extends (Maid | Callback)>(item: T) {
		// Check if we're a maid
		if (item instanceof Maid) {
			item.Destroy()
		} else {
			item()
		}
	}

	// Public Methods
	public Give<T extends Maid | Callback>(item: T, key?: any) {
		// If we're already destroyed then we can just clean the item immediately
		if (this.Destroyed) {
			return this.CleanItem(item)
		}

		// Determine our final-key
		const finalKey = (key || GetUniqueId())

		// Now store ourselves
		this.Items.set(finalKey, item)
	}

	public GiveItems<T extends Maid | Callback>(items: T[]) {
		// Loop through all of our items
		for (const item of items) {
			// Give the item
			this.Give(item)
		}
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
	}

	// Deconstructor
	public Destroy() {
		// Make sure we don't perform twice
		if (this.Destroyed === false) {
			// Set our destroyed state
			this.Destroyed = true

			// Clean out all our items
			this.CleanUp()

			// Now force remove our map
			delete (this as any).Items
		}
	}
}

// Export our maid class
export {Maid}