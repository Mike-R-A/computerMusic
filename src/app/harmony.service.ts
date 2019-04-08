import { Injectable } from '@angular/core';
import { NoteTone } from './model/tone';
import { prefillHostVars } from '@angular/core/src/render3/instructions';
import { Note } from './model/enums';

@Injectable({
  providedIn: 'root'
})
export class HarmonyService {

  constructor() { }

  firstSpeciesCounterpoint(phrase: NoteTone[], keyRange: NoteTone[]) {
    const harmony = <number[]>[];


    const firstNoteIndex = keyRange.findIndex(n => n.id === phrase[0].id); // unison
    harmony.push(firstNoteIndex);
    for (let i = 1; i < phrase.length; i++) {
      const currentMelodyNote = phrase[i];
      const previousMelodyNote = phrase[i - 1];
      const melodyChange = keyRange.findIndex(k => k.note === currentMelodyNote.note)
        - keyRange.findIndex(k => k.note === previousMelodyNote.note);
      const previousHarmonyNoteIndex = harmony[i - 1];
      const previousHarmonyNote = keyRange[previousHarmonyNoteIndex];
      if (phrase[i].note === Note.Rest) {
        harmony.push(-1);
        continue;
      }
      const indexOfToneInRange = keyRange.findIndex(n => n.id === phrase[i].id);

      const previousWasOctave = previousMelodyNote.note === previousHarmonyNote.note;
      const previousWasFifth = previousMelodyNote.note === previousHarmonyNote.note;

      let harmonyChoices = previousWasOctave ? [
        indexOfToneInRange - 2,
        indexOfToneInRange - 5,
      ] : [
          indexOfToneInRange,
          indexOfToneInRange - 2,
          indexOfToneInRange - 4,
          indexOfToneInRange - 5,
          indexOfToneInRange - 7
        ];


      harmonyChoices = harmonyChoices.filter(h => h < keyRange.length && h > 0);

      const stepwiseChoices = harmonyChoices.filter(choice => {
        return Math.abs(previousHarmonyNoteIndex - choice) === 1;
      });
      const contraryMotionChoices = harmonyChoices.filter(choice => {
        return Math.sign(previousHarmonyNoteIndex - choice) !== Math.sign(melodyChange);
      });
      const equalIsOk = harmonyChoices.includes(previousHarmonyNoteIndex);

      let noteChoice: number;
      for (const stepChoice of stepwiseChoices) {
        if (contraryMotionChoices.includes(stepChoice)) {
          noteChoice = stepChoice;
        }
      }

      if (!noteChoice) {
        if (stepwiseChoices.length > 0) {
          noteChoice = stepwiseChoices[0];
        } else if (contraryMotionChoices.length > 0) {
          noteChoice = contraryMotionChoices[0];
        } else {
          noteChoice = Math.min(...harmonyChoices.map(h => Math.abs(h - previousHarmonyNoteIndex)));
        }
      }
      harmony.push(noteChoice);
    }
    return harmony.map((h, i) => {
      const noteTone = new NoteTone();
      const note = keyRange[h];
      const melodyNote = phrase[i];
      if (h !== -1) {
        noteTone.note = note.note;
        noteTone.length = melodyNote.length;
        noteTone.octave = note.octave;
        noteTone.volume = melodyNote.volume;
      } else {
        noteTone.note = Note.Rest;
        noteTone.length = melodyNote.length;
        noteTone.octave = null;
        noteTone.volume = null;
      }

      return noteTone;
    });
  }
}
