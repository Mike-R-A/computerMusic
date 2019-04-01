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
  motifMaxSize = 20;
  motifStasisInhibitor = 0;
  motifRestChance = 0.01;
  motifMostLikelyNoteLength = NoteLength.Crotchet;
  phraseBarLength = 8;
  constructor(private soundService: SoundService,
    private musicService: MusicService,
    private keyService: KeyService, private changeDetector: ChangeDetectorRef) { }

  ngOnInit() {
    this.compose();
  }

  compose() {
    const motifs = <IMotif[]>[];

    for (let i = 0; i < 4; i++) {
      // this.motifLength = Random.next(1, 10);
      // this.motifMaxSize = Random.next(1, 12);
      // this.motifStasisInhibitor = Random.next(0, 5);
      const noteLengthValues = <NoteLength[]>[
        NoteLength.Semibreve,
        NoteLength.DottedMinim,
        NoteLength.Minim,
        NoteLength.DottedCrotchet,
        NoteLength.Crotchet,
        NoteLength.DottedQuaver,
        NoteLength.Quaver,
        NoteLength.SemiQuaver
      ];
      // this.motifMostLikelyNoteLength = noteLengthValues[Random.next(0, noteLengthValues.length - 1)];
      const motif = this.musicService.motif(this.motifLength, this.motifMaxSize,
        this.motifStasisInhibitor, this.motifRestChance, this.motifMostLikelyNoteLength);

      const alteredMotif1 = this.musicService.modifyMotif(motif, motifs);
      const alteredMotif2 = this.musicService.modifyMotif(motif, motifs);
      const chordalMotif1 = this.musicService.makeChordal(motif);
      const chordalMotif2 = this.musicService.makeChordal(motif);
      const chordalMotif3 = this.musicService.makeChordal(motif);
      motifs.push(motif);
      motifs.push(alteredMotif1);
      motifs.push(alteredMotif2);
      motifs.push(chordalMotif1);
      motifs.push(chordalMotif2);
      motifs.push(chordalMotif3);
    }

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

      for (let i = 0; i < motifs.length; i++) {
        const randomInt1 = Random.next(0, motifs.length - 1);
        const randomInt2 = Random.next(0, motifs.length - 1);
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
        const phrase = this.musicService.developMotif(key, motifs[randomInt1],
          motifs[randomInt2].pitches, timeSignature, this.phraseBarLength, 4, alterChance);
        phrases.push(phrase);
      }

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
