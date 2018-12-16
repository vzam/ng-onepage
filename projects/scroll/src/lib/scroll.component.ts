import { EventEmitter } from "@angular/core";
import { QueryList, ViewChild, Output, Input } from "@angular/core";
import {
  Component,
  OnInit,
  ContentChildren,
  AfterContentInit,
  ElementRef
} from "@angular/core";

import { WayPointDirective } from "./way-point.directive";
import { ScrollDirective } from "./scroll.directive";
import { FocusChangedEvent } from "./focus-changed-event";
import { ViewedPoint } from "./viewed-point";

import { SelectedEvent } from "./selected-event";

@Component({
  selector: "opa-scroll",
  templateUrl: "scroll.component.html",
  styleUrls: ["scroll.component.css"]
})
export class ScrollComponent implements OnInit, AfterContentInit {
  @ContentChildren(WayPointDirective, { descendants: true })
  wayPoints: QueryList<WayPointDirective>;

  @Input()
  navPos = "right";

  @Input()
  duration = 500;

  @Input()
  underflow = false;

  @Input()
  overflow = true;

  @Input()
  lockAt = 0;

  @Input()
  lockUntil = 100;

  @Input()
  easingFn = progress => progress;

  @Input()
  target: ElementRef = new ElementRef(document.documentElement);

  @ViewChild(ScrollDirective)
  scrollEl: ScrollDirective;

  current = 0;
  amount = 0;

  @Output()
  scroll: EventEmitter<ViewedPoint[]> = new EventEmitter();

  @Output()
  focusChanged: EventEmitter<FocusChangedEvent> = new EventEmitter();

  @Output()
  selected: EventEmitter<SelectedEvent> = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  ngAfterContentInit() {
    this.amount = this.wayPoints.length;
  }

  onFocusChanged(e: FocusChangedEvent) {
    this.current = e.current.index;
    this.focusChanged.emit(e);
  }

  onScroll(e: any) {
    this.scroll.emit(e);
  }

  onSelected(e: any) {
    this.selected.emit({ currentIndex: this.current, selectedIndex: e });
    this.scrollEl.scrollIdx(e);
  }
}
