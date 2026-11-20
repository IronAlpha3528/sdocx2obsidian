/**
 * State machine managing UI and worker states during conversion session.
 */
export const VALID_STATES = [
  "idle",
  "loading_runtime",
  "converting",
  "done",
  "error",
  "cancelled",
];

const TRANSITIONS = {
  idle: ["loading_runtime"],
  loading_runtime: ["converting", "error", "cancelled"],
  converting: ["done", "error", "cancelled"],
  done: ["idle", "loading_runtime"],
  error: ["idle", "loading_runtime"],
  cancelled: ["idle", "loading_runtime"],
};

export class StateMachine {
  constructor(initialState = "idle", onStateChange = null) {
    this._state = initialState;
    this._onStateChange = onStateChange;
  }

  get state() {
    return this._state;
  }

  transition(nextState) {
    const allowed = TRANSITIONS[this._state] || [];
    if (!allowed.includes(nextState)) {
      throw new Error(`Illegal transition from ${this._state} to ${nextState}`);
    }
    const prev = this._state;
    this._state = nextState;
    if (this._onStateChange) {
      this._onStateChange(this._state, prev);
    }
  }
}
