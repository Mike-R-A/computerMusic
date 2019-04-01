import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SoundService } from './sound.service';
import { Random } from './helpers/random';
import { MusicService } from './music.service';
import { KeyService } from './key.service';
import { TimeSignature } from './model/time-signature';
import { NoteLength, Note } from './model/enums';
import { NoteTone } from './model/tone';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'computer-music';
  motifLength = 16;
  motifMaxSize = 8;
  motifStasisInhibitor = 8;
  motifRestChance = 0.01;
  motifMostLikelyNoteLength = NoteLength.Crotchet;
  phraseBarLength = 8;
  isChordalChance = 0.25;
  motifs = [];
  phrases = [];
  constructor(private soundService: SoundService,
    private musicService: MusicService,
    private keyService: KeyService, private changeDetector: ChangeDetectorRef) { }

  ngOnInit() {
    this.compose();
  }

  createMotifs(numberOfMotifs = 4) {
    for (let i = 0; i < numberOfMotifs; i++) {
      const isChordal = this.isChordalChance >= 0 && this.isChordalChance <= 1
        && Random.next(1, Math.round(1 / this.isChordalChance)) === 1;
      const motif = this.musicService.motif(this.motifLength, this.motifMaxSize,
        this.motifStasisInhibitor, this.motifRestChance, this.motifMostLikelyNoteLength, isChordal);
      this.motifs.push(motif);
    }
  }

  compose() {
    this.createMotifs();
    const keys = <Note[][]>[];
    keys.push(this.keyService.major(Note.DsharpEflat));
    keys.push(this.keyService.minorHarmonic(Note.C));
    keys.push(this.keyService.major(Note.GsharpAflat));
    keys.push(this.keyService.minorHarmonic(Note.F));
    keys.push(this.keyService.major(Note.CsharpDflat));
    keys.push(this.keyService.minorHarmonic(Note.AsharpBflat));
    keys.push(this.keyService.major(Note.E));
    keys.push(this.keyService.minorHarmonic(Note.DsharpEflat));
    let allPhrases = <NoteTone[][]>[];
    for (const key of keys) {
      const phrases = <NoteTone[][]>[];
      const timeSignature = new TimeSignature();
      timeSignature.beats = 4;
      timeSignature.beatType = NoteLength.Crotchet;

      for (let i = 0; i < this.motifs.length; i++) {
        const randomInt1 = Random.next(0, this.motifs.length - 1);
        const randomInt2 = Random.next(0, this.motifs.length - 1);
        // const randomBarLength = Random.next(0, 2);
        // let maxBarLength = 0;
        // switch (randomBarLength) {
        //   case 0:
        //     {
        //       maxBarLength = 2;
        //       break;
        //     }
        //   case 1:
        //     {
        //       maxBarLength = 4;
        //       break;
        //     }
        //   case 2:
        //     {
        //       maxBarLength = 8;
        //       break;
        //     }
        // }
        const alterChance = 1 / (Random.next(1, 10));
        const phrase = this.musicService.developMotif(key, this.motifs[randomInt1],
          this.motifs[randomInt2].pitches, timeSignature, this.phraseBarLength, 4, alterChance);
        phrases.push(phrase);
      }

      console.log('phrases', phrases);

      const phraseLengthOfSection = 4;

      for (let i = 0; i < phraseLengthOfSection; i++) {
        // let randomPhraseIndex = randomIntGenerator.Next(0, phrases.Count);
        for (const tone of phrases[i]) {
          this.soundService.addNoteToTransport(tone);
        }
      }
      for (const tone of phrases[0]) {
        this.soundService.addNoteToTransport(tone);
      }

      allPhrases = [...allPhrases, ...phrases];
    }
  }

  startSound() {
    this.soundService.startTransport();
  }
}
