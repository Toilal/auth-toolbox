export class AsRequestError extends Error {
  constructor (message?: string) {
    super(message)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AsRequestError.prototype)
  }
}
