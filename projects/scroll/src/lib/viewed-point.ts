import { ElementRef } from "@angular/core";

export class ViewedPoint {
  /**
   * The percentage of the point visible (100 if the full screen is occupied).
   */
  percentage: number;

  /**
   * The index in order of definition.
   */
  index: number;

  /**
   * The reference to the element.
   */
  ref: ElementRef;
}
