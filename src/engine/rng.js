// Seeded PRNG. The only source of randomness in the whole project.
// Nothing anywhere else may call Math.random().
//
// Mulberry32 was chosen because its entire internal state is a single uint32.
// That is what lets a generator be stored inside a run state, which is what
// lets every engine function stay pure: a caller reads `cursor` back out after
// using the generator and persists it alongside the rest of the run.

/**
 * @param {number} cursor  the generator's whole state, as a uint32
 */
export function createRng(cursor) {
  let internalCursor = cursor >>> 0;

  function nextUnitInterval() {
    internalCursor = (internalCursor + 0x6d2b79f5) >>> 0;
    let scrambled = internalCursor;
    scrambled = Math.imul(scrambled ^ (scrambled >>> 15), scrambled | 1);
    scrambled ^= scrambled + Math.imul(scrambled ^ (scrambled >>> 7), scrambled | 61);
    return ((scrambled ^ (scrambled >>> 14)) >>> 0) / 4294967296;
  }

  return {
    /** Uniform in [0, 1). */
    next: nextUnitInterval,

    /** Uniform in [minimum, maximum). */
    range(minimum, maximum) {
      return minimum + nextUnitInterval() * (maximum - minimum);
    },

    /** Uniform integer in [minimum, maximum], both ends inclusive. */
    integer(minimum, maximum) {
      return minimum + Math.floor(nextUnitInterval() * (maximum - minimum + 1));
    },

    /** True with the given probability. `chance(0)` is never, `chance(1)` is always. */
    chance(probability) {
      return nextUnitInterval() < probability;
    },

    /** One item, uniformly. Returns null for an empty list. */
    pick(items) {
      if (items.length === 0) return null;
      return items[Math.floor(nextUnitInterval() * items.length)];
    },

    /**
     * One item, with probability proportional to `weightOf(item)`.
     * Non-positive weights are skipped. Returns null if nothing has weight.
     */
    weightedPick(items, weightOf) {
      let totalWeight = 0;
      for (const item of items) {
        const weight = weightOf(item);
        if (weight > 0) totalWeight += weight;
      }
      if (totalWeight <= 0) return null;

      let remaining = nextUnitInterval() * totalWeight;
      for (const item of items) {
        const weight = weightOf(item);
        if (weight <= 0) continue;
        remaining -= weight;
        if (remaining <= 0) return item;
      }
      return items[items.length - 1];
    },

    /** The generator's state. Persist this to make the run reproducible. */
    get cursor() {
      return internalCursor;
    },
  };
}

/**
 * Derives an independent generator from a cursor plus a label, without
 * advancing the original. Used where a value must be reproducible from a run
 * state without consuming the run's randomness — a card draw, for instance,
 * has to give the same answer every time it is asked about the same state.
 *
 * `stride` is a hash mixing constant, not a balance value. It has no business
 * in tuning.js.
 */
const STREAM_STRIDE = 0x9e3779b1;

export function deriveRng(cursor, streamIndex) {
  return createRng((Math.imul(streamIndex + 1, STREAM_STRIDE) ^ cursor) >>> 0);
}
