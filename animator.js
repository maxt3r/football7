// animator.js — keyframe interpolation and playback control.
// Pure logic in resolvePositions; runtime (play/pause) added in next task.

export function easeInOut(t) {
  // Standard cubic ease-in-out: symmetric around 0.5
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function interpolatePositions(a, b, alpha) {
  return { x: a.x + (b.x - a.x) * alpha, y: a.y + (b.y - a.y) * alpha };
}

// Build a per-id timeline of {t, value} samples from the keyframes,
// starting from the initial value at t=0 (if not overridden by a keyframe at t=0).
function timeline(initialValue, keyframes, accessor) {
  const samples = [];
  let lastValue = initialValue;
  for (const kf of keyframes) {
    const v = accessor(kf);
    if (v !== undefined) lastValue = v;
    samples.push({ t: kf.t, value: lastValue });
  }
  // Ensure there's a sample at t=0
  if (samples.length === 0 || samples[0].t > 0) {
    samples.unshift({ t: 0, value: initialValue });
  }
  return samples;
}

function sampleAt(samples, t) {
  if (t <= samples[0].t) return samples[0].value;
  if (t >= samples[samples.length - 1].t) return samples[samples.length - 1].value;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const alpha = span === 0 ? 0 : easeInOut((t - a.t) / span);
      return interpolatePositions(a.value, b.value, alpha);
    }
  }
  return samples[samples.length - 1].value;
}

export function resolvePositions(scenario, t) {
  const players = {};
  for (const id of Object.keys(scenario.initial.players)) {
    const samples = timeline(
      scenario.initial.players[id],
      scenario.keyframes,
      (kf) => kf.players?.[id]
    );
    players[id] = sampleAt(samples, t);
  }
  const ballSamples = timeline(
    scenario.initial.ball,
    scenario.keyframes,
    (kf) => kf.ball
  );
  const ball = sampleAt(ballSamples, t);
  return { players, ball };
}

export function createAnimator(scenario) {
  const duration = scenario.duration_ms;
  let timeMs = 0;
  let playing = false;
  let rafId = null;
  let lastFrameTime = null;
  let lastCrossedIdx = -1;
  const listeners = { tick: [], keyframe: [] };

  function emit(type, payload) {
    for (const fn of listeners[type]) fn(payload);
  }

  function checkKeyframes(prevMs, nextMs) {
    for (let i = 0; i < scenario.keyframes.length; i++) {
      const kfMs = scenario.keyframes[i].t * duration;
      const crossedNow = kfMs >= prevMs && kfMs <= nextMs && i > lastCrossedIdx;
      if (crossedNow) {
        lastCrossedIdx = i;
        emit('keyframe', { index: i, keyframe: scenario.keyframes[i], time: nextMs });
      }
    }
  }

  function stepTo(newMs) {
    const prev = timeMs;
    timeMs = Math.max(0, Math.min(duration, newMs));
    // Use a tiny negative epsilon so prev=0 fires the t=0 keyframe on first tick
    checkKeyframes(prev === 0 && lastCrossedIdx < 0 ? -1 : prev, timeMs);
    emit('tick', { time: timeMs, t: timeMs / duration });
    if (timeMs >= duration) {
      playing = false;
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
      }
    }
  }

  function frame(now) {
    if (!playing) return;
    const dt = lastFrameTime == null ? 0 : (now - lastFrameTime);
    lastFrameTime = now;
    stepTo(timeMs + dt);
    if (playing) rafId = requestAnimationFrame(frame);
  }

  return {
    play() {
      if (timeMs >= duration) {
        timeMs = 0;
        lastCrossedIdx = -1;
      }
      playing = true;
      lastFrameTime = null;
      // In browsers: schedule rAF. In Node tests: caller uses _tickFor.
      if (typeof requestAnimationFrame !== 'undefined') {
        rafId = requestAnimationFrame(frame);
      }
    },
    pause() {
      playing = false;
      if (rafId != null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
      }
    },
    seek(ms) {
      this.pause();
      const clamped = Math.max(0, Math.min(duration, ms));
      timeMs = clamped;
      // reset crossed tracking so events fire correctly on the next play
      lastCrossedIdx = -1;
      for (let i = 0; i < scenario.keyframes.length; i++) {
        if (scenario.keyframes[i].t * duration <= clamped) lastCrossedIdx = i;
      }
      emit('tick', { time: timeMs, t: timeMs / duration });
    },
    getTime() { return timeMs; },
    duration() { return duration; },
    isPlaying() { return playing; },
    on(type, fn) { listeners[type].push(fn); },
    // Test-only helper: advances time deterministically without rAF.
    _tickFor(deltaMs) { stepTo(timeMs + deltaMs); }
  };
}
