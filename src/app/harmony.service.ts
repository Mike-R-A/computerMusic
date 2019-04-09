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
    harmony.push(firstNoteIndex - 5);
    for (let i = 1; i < phrase.length; i++) {
      const currentMelodyNote = phrase[i];
      const currentMelodyNoteIndex = keyRange.findIndex(k => k.note === currentMelodyNote.note);
      const previousMelodyNote = phrase[i - 1];
      const previousMelodyNoteIndex = keyRange.findIndex(k => k.note === previousMelodyNote.note);
      const melodyIsLeap = Math.abs(currentMelodyNoteIndex - previousMelodyNoteIndex) > 1;
      const melodyChange = currentMelodyNoteIndex
        - previousMelodyNoteIndex;
      const previousHarmonyNoteIndex = harmony[i - 1];
      const previousHarmonyNote = keyRange[previousHarmonyNoteIndex];
      if (phrase[i].note === Note.Rest) {
        harmony.push(-1);
        continue;
      }
      const indexOfToneInRange = keyRange.findIndex(n => n.id === phrase[i].id);

      const previousWasOctave = previousMelodyNote && previousHarmonyNote && previousMelodyNote.note === previousHarmonyNote.note;
      const previousWasFifth = previousMelodyNoteIndex &&
        currentMelodyNoteIndex && (previousMelodyNoteIndex - currentMelodyNoteIndex) % 7 === 4;

      let harmonyChoices = previousWasOctave || previousWasFifth ? [
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
        return Math.abs(previousHarmonyNoteIndex - choice) <= 1;
      });
      const leapChoices = harmonyChoices.filter(choice => {
        return Math.abs(previousHarmonyNoteIndex - choice) > 1;
      });
      const contraryMotionChoices = harmonyChoices.filter(choice => {
        return Math.sign(previousHarmonyNoteIndex - choice) !== Math.sign(melodyChange);
      });
      const parallelMotionChoices = harmonyChoices.filter(choice => {
        return Math.sign(previousHarmonyNoteIndex - choice) === Math.sign(melodyChange);
      });
      const equalIsOk = harmonyChoices.includes(previousHarmonyNoteIndex);

      let noteChoice: number;
      const stepAndContraryChoices = harmonyChoices.filter(h => contraryMotionChoices.includes(h) && stepwiseChoices.includes(h));
      if (stepAndContraryChoices.length > 0) {
        noteChoice = stepAndContraryChoices[0];
      } else {
        if (melodyIsLeap) {
          const stepAndParallelChoices = harmonyChoices.filter(h => parallelMotionChoices.includes(h) && stepwiseChoices.includes(h));
          if (stepAndParallelChoices.length > 0) {
            noteChoice = stepAndParallelChoices[0];
          } else if (stepwiseChoices.length > 0) {
            noteChoice = stepwiseChoices[0];
          } else if (contraryMotionChoices.length > 0) {
            noteChoice = contraryMotionChoices[0];
          } else {
            noteChoice = Math.min(...harmonyChoices.map(h => Math.abs(h - previousHarmonyNoteIndex)));
          }
        } else {
          const leapAndParallelChoices = harmonyChoices.filter(h => parallelMotionChoices.includes(h) && leapChoices.includes(h));
          if (leapAndParallelChoices.length > 0) {
            noteChoice = leapAndParallelChoices[0];
          } else if (contraryMotionChoices.length > 0) {
            noteChoice = contraryMotionChoices[0];
          } else if (stepwiseChoices.length > 0) {
            noteChoice = stepwiseChoices[0];
          } else {
            noteChoice = Math.min(...harmonyChoices.map(h => Math.abs(h - previousHarmonyNoteIndex)));
          }
        }
      }



      harmony.push(noteChoice);
    }
    return harmony.map((h, i) => {
      const noteTone = new NoteTone();
      const note = keyRange[h];
      if (!note && h !== -1) {
        debugger;
      }
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
