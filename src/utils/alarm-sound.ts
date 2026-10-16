// Attention-getting alarm generated with the Web Audio API (no audio file needed)

const BEEP_DURATION_S = 0.15;
const BEEP_FREQUENCIES_HZ = [880, 660, 880, 660, 880, 660]; // hi-lo, three pairs
const CYCLE_PAUSE_S = 0.6;
const CYCLE_DURATION_S =
  BEEP_FREQUENCIES_HZ.length * BEEP_DURATION_S + CYCLE_PAUSE_S;
const MASTER_VOLUME = 0.15;
// Background tabs may only run timers once a minute, so schedule well ahead
// on the audio clock, which keeps running.
const SCHEDULE_AHEAD_S = 75;
const TOP_UP_INTERVAL_MS = 1000;

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let topUpTimer: ReturnType<typeof setInterval> | null = null;
let nextCycleTime = 0;

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

const scheduleCycle = (context: AudioContext, gain: GainNode, start: number) => {
  BEEP_FREQUENCIES_HZ.forEach((frequency, i) => {
    const beepStart = start + i * BEEP_DURATION_S;
    const oscillator = context.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(beepStart);
    oscillator.stop(beepStart + BEEP_DURATION_S * 0.9); // small gap between beeps
  });
};

const scheduleAhead = () => {
  if (!audioContext || !masterGain) return;

  while (nextCycleTime < audioContext.currentTime + SCHEDULE_AHEAD_S) {
    scheduleCycle(audioContext, masterGain, nextCycleTime);
    nextCycleTime += CYCLE_DURATION_S;
  }
};

export const startAlarm = () => {
  if (masterGain) return; // already sounding

  const context = getAudioContext();
  context.resume().catch(() => {
    /* plays once a user gesture unlocks audio */
  });

  masterGain = context.createGain();
  masterGain.gain.value = MASTER_VOLUME;
  masterGain.connect(context.destination);

  nextCycleTime = context.currentTime + 0.05;
  scheduleAhead();
  topUpTimer = setInterval(scheduleAhead, TOP_UP_INTERVAL_MS);
};

export const stopAlarm = () => {
  if (topUpTimer) {
    clearInterval(topUpTimer);
    topUpTimer = null;
  }

  // Disconnecting the master gain silences every beep already scheduled
  if (masterGain && audioContext) {
    masterGain.gain.setValueAtTime(0, audioContext.currentTime);
    masterGain.disconnect();
  }
  masterGain = null;
};
