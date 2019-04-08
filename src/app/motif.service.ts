import { Injectable } from '@angular/core';
import { Random } from './helpers/random';
import { Motif } from './model/motif';
import { NoteLength } from './model/enums';
import { EnumHelper } from './helpers/enum-helper';

@Injectable({
  providedIn: 'root'
})
export class MotifService {
  noteLengths: NoteLength[];
  constructor() {
    this.noteLengths = EnumHelper.getEnumNumberArray(NoteLength);
  }

  public motif(length: number, maxSize: number, sameDirectionChance = 0.5,
    restChance = 0.01, mostLikelyNoteLength = NoteLength.Crotchet, isChordal = false, mostLikelyNoteLengthFactor = 1): Motif {
    let motif = new Motif();
    let shouldAddRest = Random.booleanByProbability(restChance);
    let previousDirection: number;
    let nextPitch: number;
    let previousPitch: number;
    let lengthSoFar = 0;
    while (lengthSoFar < length) {
      shouldAddRest = Random.booleanByProbability(restChance);
      if (shouldAddRest) {
        nextPitch = -1;
      } else if (previousPitch && previousPitch !== -1) {
        {
          nextPitch = this.chooseNextPitchBasedOnPrevious(sameDirectionChance, previousDirection, previousPitch, maxSize);
          previousDirection = nextPitch - previousPitch;
        }
      } else {
        nextPitch = Random.next(0, maxSize);
        previousDirection = Random.next(-1, 1);
      }
      motif.pitches.push(nextPitch);
      previousPitch = nextPitch;
      const lengthToFill = length - lengthSoFar;
      motif.rhythm.push(this.randomNoteLength(mostLikelyNoteLength, mostLikelyNoteLengthFactor, lengthToFill));
      lengthSoFar = this.totalLength(motif.rhythm);
    }
    if (isChordal) {
      motif = this.makeChordal(motif);
    }
    return motif;
  }

  private chooseNextPitchBasedOnPrevious(sameDirectionChance: number, previousDirection: number, previousPitch: number, maxSize: number) {
    const shouldMoveInSameDirection = Random.booleanByProbability(sameDirectionChance);
    const direction = shouldMoveInSameDirection && previousDirection !== 0 ? previousDirection : Random.next(-1, 1);
    const potentialNextPitch = previousPitch + direction;
    if (potentialNextPitch < 0) {
      return previousPitch + Random.next(0, 1);
    } else if (potentialNextPitch > maxSize) {
      return previousPitch + Random.next(-1, 0);
    } else {
      return potentialNextPitch;
    }
  }

  private randomNoteLength(mostLikelyNoteLength: NoteLength = null, mostLikelyNoteLengthFactor: number,
    lengthToFill: number): NoteLength {
    const validNoteLengths = this.noteLengths.filter(n => {
      return n <= lengthToFill;
    });
    const randomNoteLengthIndex = Random.next(0, mostLikelyNoteLengthFactor * (validNoteLengths.length - 1));
    if (randomNoteLengthIndex < validNoteLengths.length) {
      return validNoteLengths[randomNoteLengthIndex];
    } else {
      return mostLikelyNoteLength || NoteLength.Crotchet;
    }
  }

  private makeChordal(motif: Motif): Motif {
    const chordalMotif = new Motif();
    chordalMotif.pitches = motif.pitches.map(i => i === -1 ? i : i * 2);
    chordalMotif.rhythm = [...motif.rhythm];

    return chordalMotif;
  }

  totalLength(noteLengths: NoteLength[]) {
    return <number>noteLengths.reduce((a, b) => {
      return a + b;
    });
  }

  public modifyMotif(motif: Motif, motifPool: Motif[]): Motif {
    const noOfTypesOfDevelopment = 6;
    let developedMotif = new Motif();
    let developedMotifPitches = [...motif.pitches];
    let developedMotifRhythm = [...motif.rhythm];
    const randomInt = Random.next(1, noOfTypesOfDevelopment);
    const displacement = Random.next(-1, 1);
    switch (randomInt) {
      case 1:
        {
          developedMotifPitches.reverse();
          break;
        }
      case 2:
        {
          developedMotifPitches = [...developedMotifPitches, ...this.transpose(developedMotifPitches, displacement)];
          developedMotifRhythm = [...developedMotifRhythm, ...developedMotifRhythm];
          break;
        }
      case 3:
        {
          const copyPitches = [...developedMotifPitches];
          const copyRhythm = [...developedMotifRhythm];
          copyPitches.reverse();
          copyRhythm.reverse();
          developedMotifPitches = [...developedMotifPitches, ...this.transpose(copyPitches, displacement)];
          developedMotifRhythm = [...developedMotifRhythm, ...copyRhythm];
          break;
        }
      case 4:
        {
          const copyPitches = [...developedMotifPitches];
          const copyRhythm = [...developedMotifRhythm];
          developedMotifPitches.reverse();
          copyRhythm.reverse();
          developedMotifPitches = [...developedMotifPitches, ...this.transpose(copyPitches, displacement)];
          developedMotifRhythm = [...developedMotifRhythm, ...copyRhythm];
          break;
        }
      case 5:
        {
          if (motifPool != null) {
            const poolSelection = Random.next(0, motifPool.length - 1);
            developedMotif = this.concatenate(motif, motifPool[poolSelection]);
          }
          break;
        }
      case 6:
        {
          const max = Math.max(...motif.pitches);
          developedMotifPitches = motif.pitches.map(p => max - p);
          break;
        }
    }

    const minValue = Math.min(...developedMotifPitches);
    if (minValue < 0) {
      const transposeAmount = Math.abs(minValue);
      developedMotifPitches = this.transpose(developedMotifPitches, transposeAmount);
    }

    developedMotif.pitches = developedMotifPitches;
    developedMotif.rhythm = developedMotifRhythm;
    return developedMotif;
  }


  private transpose(motif: number[], amount: number): number[] {
    return motif.map(i => i === -1 ? i : i + amount);
  }

  private concatenate(motif1: Motif, motif2: Motif): Motif {
    const newMotif = new Motif();
    newMotif.pitches = [...newMotif.pitches, ...motif1.pitches];
    newMotif.rhythm = [...newMotif.rhythm, ...motif1.rhythm];
    newMotif.pitches = [...newMotif.pitches, ...motif2.pitches];
    newMotif.rhythm = [...newMotif.rhythm, ...motif2.rhythm];
    return newMotif;
  }
}


