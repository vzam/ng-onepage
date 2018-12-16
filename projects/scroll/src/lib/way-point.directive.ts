import { ElementRef } from '@angular/core';
import { Directive } from '@angular/core';
import { ScrollDirective } from "./scroll.directive";

@Directive({
  selector: '[opaWayPoint]'
})
export class WayPointDirective {

  constructor(public ref: ElementRef) {
  }

}
