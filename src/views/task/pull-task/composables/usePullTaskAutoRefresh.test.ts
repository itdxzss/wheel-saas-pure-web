import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { effectScope } from "vue";
import {
  PULL_TASK_AUTO_REFRESH_INTERVAL_MS,
  usePullTaskAutoRefresh,
  type PullTaskAutoRefreshOptions
} from "./usePullTaskAutoRefresh";

type IntervalHandle = ReturnType<typeof setInterval>;

interface Harness {
  /** 当前仍在运行的计时器回调。 */
  running: Map<IntervalHandle, () => void>;
  delays: number[];
  listeners: Set<() => void>;
  tickAll: () => void;
  setVisibility: (state: DocumentVisibilityState) => void;
}

const originalSetInterval = globalThis.setInterval;
const originalClearInterval = globalThis.clearInterval;
const originalDocument = Object.getOwnPropertyDescriptor(
  globalThis,
  "document"
);
let harness: Harness;

function installHarness(): Harness {
  const running = new Map<IntervalHandle, () => void>();
  const delays: number[] = [];
  const listeners = new Set<() => void>();
  let nextHandle = 1;
  let visibilityState: DocumentVisibilityState = "visible";

  globalThis.setInterval = ((callback: () => void, delay?: number) => {
    const handle = nextHandle++ as unknown as IntervalHandle;
    running.set(handle, callback);
    delays.push(Number(delay));
    return handle;
  }) as typeof setInterval;
  globalThis.clearInterval = ((handle?: IntervalHandle) => {
    if (handle !== undefined) running.delete(handle);
  }) as typeof clearInterval;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      get visibilityState() {
        return visibilityState;
      },
      addEventListener: (type: string, listener: () => void) => {
        if (type === "visibilitychange") listeners.add(listener);
      },
      removeEventListener: (type: string, listener: () => void) => {
        if (type === "visibilitychange") listeners.delete(listener);
      }
    }
  });

  return {
    running,
    delays,
    listeners,
    tickAll: () => [...running.values()].forEach(callback => callback()),
    setVisibility: state => {
      visibilityState = state;
      listeners.forEach(listener => listener());
    }
  };
}

function mount(overrides: Partial<PullTaskAutoRefreshOptions> = {}) {
  const calls = { count: 0 };
  const scope = effectScope();
  const state = scope.run(() =>
    usePullTaskAutoRefresh({
      active: () => true,
      busy: () => false,
      refresh: () => {
        calls.count++;
      },
      ...overrides
    })
  );
  assert.ok(state);
  return { calls, scope, state };
}

describe("pull task auto refresh", () => {
  beforeEach(() => {
    harness = installHarness();
  });

  afterEach(() => {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
    if (originalDocument) {
      Object.defineProperty(globalThis, "document", originalDocument);
    } else {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  it("is enabled by default and refreshes every 10 seconds", () => {
    const { calls, scope, state } = mount();

    assert.equal(state.automatic.value, true);
    assert.equal(PULL_TASK_AUTO_REFRESH_INTERVAL_MS, 10_000);
    assert.deepEqual(harness.delays, [10_000]);
    harness.tickAll();
    harness.tickAll();
    assert.equal(calls.count, 2);
    scope.stop();
  });

  it("stops refreshing once the operator turns it off", () => {
    const { calls, scope, state } = mount();

    state.automatic.value = false;
    harness.tickAll();
    assert.equal(calls.count, 0);
    state.automatic.value = true;
    harness.tickAll();
    assert.equal(calls.count, 1);
    scope.stop();
  });

  it("skips a round while the previous request has not returned", () => {
    let busy = true;
    const { calls, scope } = mount({ busy: () => busy });

    harness.tickAll();
    assert.equal(calls.count, 0);
    busy = false;
    harness.tickAll();
    assert.equal(calls.count, 1);
    scope.stop();
  });

  it("does nothing while the owning view is not shown", () => {
    let active = false;
    const { calls, scope } = mount({ active: () => active });

    harness.tickAll();
    assert.equal(calls.count, 0);
    active = true;
    harness.tickAll();
    assert.equal(calls.count, 1);
    scope.stop();
  });

  it("pauses while the browser tab is hidden and refreshes immediately when it returns", () => {
    const { calls, scope } = mount();

    harness.setVisibility("hidden");
    assert.equal(harness.running.size, 0);
    harness.tickAll();
    assert.equal(calls.count, 0);

    harness.setVisibility("visible");
    assert.equal(calls.count, 1);
    assert.equal(harness.running.size, 1);
    assert.deepEqual(harness.delays, [10_000, 10_000]);
    harness.tickAll();
    assert.equal(calls.count, 2);
    scope.stop();
  });

  it("does not stack an immediate refresh on a request still in flight", () => {
    const { calls, scope } = mount({ busy: () => true });

    harness.setVisibility("hidden");
    harness.setVisibility("visible");
    assert.equal(calls.count, 0);
    assert.equal(harness.running.size, 1);
    scope.stop();
  });

  it("clears the timer and visibility listener when disposed", () => {
    const { calls, scope } = mount();
    assert.equal(harness.running.size, 1);
    assert.equal(harness.listeners.size, 1);

    scope.stop();

    assert.equal(harness.running.size, 0);
    assert.equal(harness.listeners.size, 0);
    harness.setVisibility("hidden");
    harness.setVisibility("visible");
    assert.equal(calls.count, 0);
  });
});
