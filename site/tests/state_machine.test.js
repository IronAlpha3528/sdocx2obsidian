import test from "node:test";
import assert from "node:assert/strict";
import { StateMachine } from "../js/state_machine.js";

test("state machine initial state is idle", () => {
  const sm = new StateMachine();
  assert.equal(sm.state, "idle");
});

test("state machine legal transitions", () => {
  const sm = new StateMachine();

  sm.transition("loading_runtime");
  assert.equal(sm.state, "loading_runtime");

  sm.transition("converting");
  assert.equal(sm.state, "converting");

  sm.transition("done");
  assert.equal(sm.state, "done");

  sm.transition("idle");
  assert.equal(sm.state, "idle");
});

test("state machine cancellation during load", () => {
  const sm = new StateMachine();
  sm.transition("loading_runtime");
  sm.transition("cancelled");
  assert.equal(sm.state, "cancelled");

  sm.transition("idle");
  assert.equal(sm.state, "idle");
});

test("state machine cancellation during conversion", () => {
  const sm = new StateMachine();
  sm.transition("loading_runtime");
  sm.transition("converting");
  sm.transition("cancelled");
  assert.equal(sm.state, "cancelled");
});

test("state machine error transition", () => {
  const sm = new StateMachine();
  sm.transition("loading_runtime");
  sm.transition("error");
  assert.equal(sm.state, "error");
});

test("state machine rejects illegal transitions", () => {
  const sm = new StateMachine();
  assert.throws(() => sm.transition("converting"), /Illegal transition from idle to converting/);
  assert.throws(() => sm.transition("done"), /Illegal transition from idle to done/);
});
