// Attention sounds generated with the Web Audio API (no audio files needed)

// Background tabs may only run timers once a minute, so sounds are scheduled
// well ahead on the audio clock, which keeps running.
const SCHEDULE_AHEAD_S = 75;
const TOP_UP_INTERVAL_MS = 1000;

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Browsers only allow audio after a user gesture; call this from one
export const unlockAlarmAudio = () => {
  const context = getAudioContext();
  context.resume().catch(() => {
    /* still locked; a later gesture will retry */
  });

  // iOS needs a sound started inside the gesture to unlock audio
  const silence = context.createBufferSource();
  silence.buffer = context.createBuffer(1, 1, context.sampleRate);
  silence.connect(context.destination);
  silence.start();
};

const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"] as const;
let unlockInstalled = false;

// Unlocks audio on the first user interaction anywhere on the page. Safe to call more than once.
export const installAudioUnlock = () => {
  if (unlockInstalled) return;
  unlockInstalled = true;

  const unlock = () => {
    unlockAlarmAudio();
    UNLOCK_EVENTS.forEach((event) =>
      document.removeEventListener(event, unlock, true),
    );
  };
  UNLOCK_EVENTS.forEach((event) =>
    document.addEventListener(event, unlock, true),
  );
};

type ScheduleCycle = (
  context: AudioContext,
  output: GainNode,
  start: number,
) => void;

// A sound pattern that repeats every cycleS seconds until stopped
const createRepeatingSound = (
  cycleS: number,
  volume: number,
  scheduleCycle: ScheduleCycle,
) => {
  let output: GainNode | null = null;
  let topUpTimer: ReturnType<typeof setInterval> | null = null;
  let nextCycleTime = 0;

  const scheduleAhead = () => {
    if (!audioContext || !output) return;

    while (nextCycleTime < audioContext.currentTime + SCHEDULE_AHEAD_S) {
      scheduleCycle(audioContext, output, nextCycleTime);
      nextCycleTime += cycleS;
    }
  };

  const start = () => {
    if (output) return; // already sounding

    const context = getAudioContext();
    context.resume().catch(() => {
      /* plays once a user gesture unlocks audio */
    });

    output = context.createGain();
    output.gain.value = volume;
    output.connect(context.destination);

    nextCycleTime = context.currentTime + 0.05;
    scheduleAhead();
    topUpTimer = setInterval(scheduleAhead, TOP_UP_INTERVAL_MS);
  };

  const stop = () => {
    if (topUpTimer) {
      clearInterval(topUpTimer);
      topUpTimer = null;
    }

    // Disconnecting the output silences every sound already scheduled
    if (output && audioContext) {
      output.gain.setValueAtTime(0, audioContext.currentTime);
      output.disconnect();
    }
    output = null;
  };

  return { start, stop };
};

// Boundary alarm: urgent hi-lo square-wave beeps, three pairs then a pause
const BEEP_DURATION_S = 0.15;
const BEEP_FREQUENCIES_HZ = [880, 660, 880, 660, 880, 660];
const BEEP_PAUSE_S = 0.6;

const alarm = createRepeatingSound(
  BEEP_FREQUENCIES_HZ.length * BEEP_DURATION_S + BEEP_PAUSE_S,
  0.15,
  (context, output, start) => {
    BEEP_FREQUENCIES_HZ.forEach((frequency, i) => {
      const beepStart = start + i * BEEP_DURATION_S;
      const oscillator = context.createOscillator();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      oscillator.connect(output);
      oscillator.start(beepStart);
      oscillator.stop(beepStart + BEEP_DURATION_S * 0.9); // small gap between beeps
    });
  },
);

export const startAlarm = alarm.start;
export const stopAlarm = alarm.stop;

// Notice chime: a soft rising two-note "ding-ding", repeated occasionally
const CHIME_INTERVAL_S = 10;
const CHIME_NOTES_HZ = [1046.5, 1318.5]; // C6, E6
const CHIME_NOTE_GAP_S = 0.18;
const CHIME_NOTE_DURATION_S = 0.9;
const CHIME_VOLUME = 0.25;

const scheduleChime: ScheduleCycle = (context, output, start) => {
  CHIME_NOTES_HZ.forEach((frequency, i) => {
    const noteStart = start + i * CHIME_NOTE_GAP_S;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    // Quick attack, bell-like decay
    envelope.gain.setValueAtTime(0, noteStart);
    envelope.gain.linearRampToValueAtTime(1, noteStart + 0.01);
    envelope.gain.exponentialRampToValueAtTime(
      0.001,
      noteStart + CHIME_NOTE_DURATION_S,
    );
    oscillator.connect(envelope).connect(output);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + CHIME_NOTE_DURATION_S);
  });
};

const chime = createRepeatingSound(CHIME_INTERVAL_S, CHIME_VOLUME, scheduleChime);

export const startChime = chime.start;
export const stopChime = chime.stop;

// A single chime, e.g. to confirm sound is working
export const playChimeOnce = () => {
  const context = getAudioContext();
  context.resume().catch(() => {
    /* plays once a user gesture unlocks audio */
  });

  const output = context.createGain();
  output.gain.value = CHIME_VOLUME;
  output.connect(context.destination);
  scheduleChime(context, output, context.currentTime + 0.05);
  setTimeout(() => output.disconnect(), 2000);
};
