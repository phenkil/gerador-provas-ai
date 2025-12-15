import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Para ngModel
import { HttpClientModule } from '@angular/common/http'; // Para API

import { AppComponent } from './app.component';
import { ContentGeneratorService } from './services/gemini.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [ContentGeneratorService],
  bootstrap: [AppComponent]
})
export class AppModule { }