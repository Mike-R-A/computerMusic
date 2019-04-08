import { Injectable, EventEmitter } from '@angular/core';
import { NoteLength, Note } from './model/enums';
import { NoteTone } from './model/tone';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  synths = <any[]>[];
  minOctave = 0;
  maxOctave = 7;
  time: { bar: number, beat: number, sixteenth: number }[] = [
    { bar: 0, beat: 0, sixteenth: 0 },
    { bar: 0, beat: 0, sixteenth: 0 }
  ];
  metronome: any;
  isSetup = false;
  notePlayed = new EventEmitter<NoteTone>();

  get composedTime() {
    return this.time[0].bar.toString() + ':' +
      this.time[0].beat.toString() + ':' +
      this.time[0].sixteenth.toString();
  }

  getComposedTime(index: number = 0) {
    return this.time[index].bar.toString() + ':' +
      this.time[index].beat.toString() + ':' +
      this.time[index].sixteenth.toString();
  }

  constructor() {
  }

  addTime(noteLength: NoteLength, index: number, beatsInBar = 4) {
    const addedToBeat = this.time[index].beat + noteLength;
    let bars = 0;
    const remainder = addedToBeat % beatsInBar;
    const beats = Math.floor(remainder);
    const sixteenths = (remainder - beats) / 0.25;
    this.time[index].beat = beats;
    this.time[index].sixteenth = this.time[index].sixteenth + sixteenths;
    if (addedToBeat >= beatsInBar) {
      bars = Math.floor(addedToBeat / beatsInBar);
      this.time[index].bar = this.time[index].bar + bars;
    }
  }

  addNoteToTransport(tone: NoteTone, synthIndex = 0) {
    Tone.Transport.schedule((time) => {
      if (tone.note !== Note.Rest) {
        this.playTone(this.synths[synthIndex], tone, time);
      }
    }, this.getComposedTime(synthIndex));

    this.addTime(tone.length, synthIndex);
  }

  addPhraseToTransport(phrase: NoteTone[], synthIndex = 0) {
    for (const tone of phrase) {
      this.addNoteToTransport(tone, synthIndex);
    }
  }

  toggleTransport() {
    if (!this.isSetup) {
      this.setUp();
      this.isSetup = true;
    }
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
    Tone.Transport.toggle();
  }

  playTone(instrument: any, tone: NoteTone, time: any) {
    this.playSound(instrument, tone.id, this.mapNoteLengthToDuration(tone.length), time, tone.volume);
    this.notePlayed.emit(tone);
  }

  playSound(instrument: any, note: string, duration: string, time: any, volume: number) {
    instrument.triggerAttackRelease(note, duration, time, volume);
  }

  mapNoteLengthToDuration(noteLength: NoteLength) {
    switch (noteLength) {
      case NoteLength.Semibreve: {
        return '1n';
      }
      case NoteLength.DottedMinim: {
        return '2n.';
      }
      case NoteLength.Minim: {
        return '2n';
      }
      case NoteLength.DottedCrotchet: {
        return '4n.';
      }
      case NoteLength.Crotchet: {
        return '4n';
      }
      case NoteLength.DottedQuaver: {
        return '8n.';
      }
      case NoteLength.Quaver: {
        return '8n';
      }
      case NoteLength.SemiQuaver: {
        return '16n';
      }
    }
  }

  setUp() {
    const reverb1 = new Tone.JCReverb(0.2).connect(Tone.Master);
    const panner1 = new Tone.Panner(0.2).connect(reverb1);
    const panner2 = new Tone.Panner(-0.2).connect(reverb1);
    this.synths.push(new Tone.Synth());
    this.synths.push(new Tone.AMSynth());
    this.synths.push(new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 1,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
        attackCurve: 'exponential'
      }
    }));

    this.synths[0].connect(panner1);
    this.synths[1].connect(panner2);
    this.synths[2].connect(Tone.Master);

    Tone.Transport.bpm.value = 120;
  }

  metronomeOn() {
    this.metronome = Tone.Transport.scheduleRepeat((time) => {
      this.synths[2].triggerAttackRelease('C2', this.mapNoteLengthToDuration(NoteLength.Quaver), time, 0.5);
    }, '4n');
  }

  metronomeOff() {
    Tone.Transport.clear(this.metronome);
  }

  get transportTime() {
    return Tone.Transport.position;
  }
}
