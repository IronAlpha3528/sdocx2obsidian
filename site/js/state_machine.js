/**
 * State machine managing UI and worker states during conversion session.
 */
export const VALID_STATES = [
  "idle",
  "files_selected",
  "loading_runtime",
  "converting",
  "done",
  "error",
  "cancelled",
];

const TRANSITIONS = {
  idle: ["loading_runtime", "files_selected"],
  files_selected: ["loading_runtime", "idle"],
  loading_runtime: ["converting", "error", "cancelled", "files_selected"],
  converting: ["done", "error", "cancelled"],
  done: ["idle", "loading_runtime", "files_selected"],
  error: ["idle", "loading_runtime", "files_selected"],
  cancelled: ["idle", "loading_runtime", "files_selected"],
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
