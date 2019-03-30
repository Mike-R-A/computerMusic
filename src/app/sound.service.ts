import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  synth: any;
  minOctave = 2;
  maxOctave = 6;
  constructor() {
    this.synth = new Tone.Synth().toMaster();
  }

  playNote(note: string, duration: string) {
    this.synth.triggerAttackRelease('C4', '8n');
  }
}
