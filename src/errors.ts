/**
 * Custom error classes for @motioneffector/spatial
 */

/**
 * Base error class for all spatial errors
 */
export class SpatialError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SpatialError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Thrown when validation fails (invalid parameters, missing nodes, etc.)
 */
export class ValidationError extends SpatialError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
