declare module 'jest-date-mock' {
  /**
   * Changes date by an offset. Can be negative.
   *
   * @param ms
   * @default 0
   */
  export function advanceBy (ms: number): void;

  /**
   * Sets date to a timestamp or Date.
   *
   * @param ms
   * @default 0
   */
  export function advanceTo (ms?: number | Date): void;

  /**
   * Un-mocks the Date class.
   */
  export function clear (): void;
}
