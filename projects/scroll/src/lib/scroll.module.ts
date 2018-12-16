import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from "@angular/core";
import { ScrollComponent } from "./scroll.component";
import { NavComponent } from "./nav/nav.component";
import { WayPointDirective } from "./way-point.directive";
import { ScrollDirective } from './scroll.directive';

@NgModule({
  declarations: [
    ScrollComponent,
    NavComponent,
    WayPointDirective,
    ScrollDirective
  ],
  imports: [BrowserModule],
  exports: [
    ScrollComponent,
    NavComponent,
    WayPointDirective,
    ScrollDirective
  ]
})
export class ScrollModule {}
