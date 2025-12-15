import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {ContentGeneratorService} from './service/gemini.service'
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [ContentGeneratorService],
  bootstrap: [AppComponent]
})
export class AppModule { }
