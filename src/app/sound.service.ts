import { Injectable, EventEmitter } from '@angular/core';
import { NoteLength, Note } from './model/enums';
import { NoteTone } from './model/tone';
import { Part } from './model/Part';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  parts = <Part[]>[];
  minOctave = 0;
  maxOctave = 7;
  metronome: any;
  isSetup = false;
  notePlayed = new EventEmitter<NoteTone>();

  get composedTime() {
    return this.parts[0] ? this.parts[0].composedTime.time : '00:00:00';
  }

  constructor() {
    this.setUp();
    this.isSetup = true;
  }

  addNoteToTransport(tone: NoteTone, part: Part) {
    Tone.Transport.schedule((time) => {
      if (tone.note !== Note.Rest) {
        this.playTone(part.instrument, tone, time);
      }
    }, part.composedTime.time);

    part.composedTime.addTime(tone.length);
  }

  addPhraseToTransport(phrase: NoteTone[], partNumber = 0) {
    for (const tone of phrase) {
      this.addNoteToTransport(tone, this.parts[partNumber]);
    }
  }

  toggleTransport() {
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
    const reverb1 = new Tone.JCReverb(0.3).connect(Tone.Master);
    const panner1 = new Tone.Panner(0.2).connect(reverb1);
    const panner2 = new Tone.Panner(-0.2).connect(reverb1);
    const panner3 = new Tone.Panner(0.1).connect(reverb1);
    const part1 = new Part();
    part1.instrument = new Tone.Synth();
    const part2 = new Part();
    part2.instrument = new Tone.AMSynth();
    const part3 = new Part();
    part3.instrument = new Tone.Synth();
    const part4 = new Part();
    part4.instrument = new Tone.MembraneSynth({
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
    });
    this.parts.push(part1);
    this.parts.push(part2);
    this.parts.push(part3);
    this.parts.push(part4);


    this.parts[0].instrument.connect(panner1);
    this.parts[1].instrument.connect(panner2);
    this.parts[2].instrument.connect(panner3);
    this.parts[3].instrument.connect(Tone.Master);

    Tone.Transport.bpm.value = 120;
    this.setBpm(120);
  }

  metronomeOn() {
    this.metronome = Tone.Transport.scheduleRepeat((time) => {
      this.parts[3].instrument.triggerAttackRelease('C2', this.mapNoteLengthToDuration(NoteLength.Quaver), time, 1);
    }, '4n', '00:00:00');
  }

  metronomeOff() {
    Tone.Transport.clear(this.metronome);
  }

  get transportTime() {
    return Tone.Transport.position;
  }

  setBpm(bpm = 120) {
    Tone.Transport.bpm.value = bpm;
  }
}
