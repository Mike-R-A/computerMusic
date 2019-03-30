import { Component, OnInit } from '@angular/core';
import { SoundService } from './sound.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'computer-music';
  synth: any;

  constructor(private soundService: SoundService) { }

  ngOnInit() {
    this.synth = new Tone.Synth().toMaster();
  }

  playSound() {
    this.soundService.playNote('C4', '8n');
  }
}
