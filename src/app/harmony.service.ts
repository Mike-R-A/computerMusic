import { Injectable } from '@angular/core';
import { NoteTone } from './model/tone';
import { prefillHostVars } from '@angular/core/src/render3/instructions';
import { Note } from './model/enums';

@Injectable({
  providedIn: 'root'
})
export class HarmonyService {

  constructor() { }

  firstSpeciesCounterpoint(phrase: NoteTone[], keyRange: NoteTone[], firstNoteHarmonyInterval = 5) {
    const harmony = <number[]>[];

    const firstNoteIndex = keyRange.findIndex(n => n.id === phrase[0].id); // unison
    harmony.push(firstNoteIndex - firstNoteHarmonyInterval);
    for (let i = 1; i < phrase.length; i++) {
      const currentMelodyNoteIndex = keyRange.findIndex(k => k.id === phrase[i].id);
      const previousMelodyNoteIndex = keyRange.findIndex(k => k.id === phrase[i - 1].id);
      const previousHarmonyNoteIndex = harmony[i - 1];

      const nextNote = this.harmoniseNoteFirstSpecies(currentMelodyNoteIndex,
        previousMelodyNoteIndex, previousHarmonyNoteIndex, keyRange);

      harmony.push(nextNote);
    }
    return harmony.map((h, i) => {
      const noteTone = new NoteTone();
      const note = keyRange[h];
      const melodyNote = phrase[i];
      if (h !== -1) {
        noteTone.note = note ? note.note : Note.Rest;
        noteTone.length = melodyNote.length;
        noteTone.octave = note ? note.octave : null;
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

  harmoniseNoteFirstSpecies(currentMelodyNoteIndex: number, previousMelodyNoteIndex: number,
    previousHarmonyNoteIndex: number, keyRange: NoteTone[]) {
    if (currentMelodyNoteIndex === -1) {
      return -1;
    }

    const previousMelodyNote = keyRange[previousMelodyNoteIndex];
    const previousHarmonyNote = keyRange[previousHarmonyNoteIndex];

    const melodyIsLeap = Math.abs(currentMelodyNoteIndex - previousMelodyNoteIndex) > 1;
    const melodyChange = currentMelodyNoteIndex
      - previousMelodyNoteIndex;

    const previousWasOctave = previousMelodyNote && previousHarmonyNote && previousMelodyNote.note === previousHarmonyNote.note;
    const previousWasFifth = previousMelodyNoteIndex &&
      currentMelodyNoteIndex && (previousMelodyNoteIndex - currentMelodyNoteIndex) % 7 === 4;

    let harmonyChoices = previousWasOctave || previousWasFifth ? [
      currentMelodyNoteIndex - 2,
      currentMelodyNoteIndex - 5,
    ] : [
        currentMelodyNoteIndex,
        currentMelodyNoteIndex - 2,
        currentMelodyNoteIndex - 4,
        currentMelodyNoteIndex - 5,
        currentMelodyNoteIndex - 7
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
    return noteChoice;
  }
}
