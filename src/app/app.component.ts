import { Component, OnInit } from '@angular/core';
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
  synth: any;

  constructor(private soundService: SoundService,
    private musicService: MusicService,
    private keyService: KeyService) { }

  ngOnInit() {
    this.synth = new Tone.Synth().toMaster();
  }

  playSound() {
    const motifs = <IMotif[]>[];

    for (let i = 0; i < 4; i++) {
      const randomLength = Random.next(1, 10);
      console.log('Motif Length, ' + randomLength);
      const randomMaxSize = Random.next(1, 12);
      console.log('Motif Max Size, ' + randomMaxSize);
      const randomStasisInhibitor = Random.next(0, 5);
      console.log('Motif Stasis Inhibitor, ' + randomStasisInhibitor);
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
      const randomNoteLength = noteLengthValues[Random.next(0, noteLengthValues.length - 1)];
      console.log('Most common note length, ' + randomNoteLength.toString());
      const motif = this.musicService.motif(randomLength, randomMaxSize,
        randomStasisInhibitor, 0.01, randomNoteLength);

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
        const randomBarLength = Random.next(0, 2);
        let maxBarLength = 0;
        switch (randomBarLength) {
          case 0:
            {
              maxBarLength = 2;
              break;
            }
          case 1:
            {
              maxBarLength = 4;
              break;
            }
          case 2:
            {
              maxBarLength = 8;
              break;
            }
        }
        const alterChance = 1 / (Random.next(1, 10));
        const phrase = this.musicService.developMotif(key, motifs[randomInt1],
          motifs[randomInt2].pitches, timeSignature, maxBarLength, 4, alterChance);
        phrases.push(phrase);
      }

      console.log();
      console.log();
      console.log('Section');
      console.log();

      const phraseLengthOfSection = 4;

      for (let i = 0; i < phraseLengthOfSection; i++) {
        console.log(' | ');
        // let randomPhraseIndex = randomIntGenerator.Next(0, phrases.Count);
        for (const tone of phrases[i]) {

          console.log(tone.id + ' ');
          this.soundService.addNoteToTransport(tone);
        }
      }
      console.log(' | ');
      for (const tone of phrases[0]) {
        console.log(tone.id + ' ');
        this.soundService.addNoteToTransport(tone);
      }

      console.log(' || ');
      allPhrases = [...allPhrases, ...phrases];
    }

    this.soundService.startTransport();
  }

  ngOnDestroy() {
    this.soundService.stopTransport();
  }
}
