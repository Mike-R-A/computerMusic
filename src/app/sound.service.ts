import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  synth: any;
  constructor() {
    this.synth = new Tone.Synth().toMaster();
  }

  playNote(note: string, duration: string) {
    this.synth.triggerAttackRelease('C4', '8n');
  }
}
