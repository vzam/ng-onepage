import { includes } from "lodash";
import { EventEmitter, SimpleChanges } from "@angular/core";
import { ViewedPoint } from "../lib/viewed-point";
import {
  Directive,
  Input,
  Output,
  ContentChildren,
  QueryList,
  ElementRef,
  OnChanges,
  AfterContentInit,
  ContentChild,
  ViewChild,
  ViewChildren,
  ContentChildDecorator,
  AfterViewInit,
  forwardRef
} from "@angular/core";

import { WayPointDirective } from "../lib/way-point.directive";
import { FocusChangedEvent } from "./focus-changed-event";

@Directive({
  selector: "[opaScroll]"
})
/* tslint:disable:member-ordering */
export class ScrollDirective implements AfterContentInit, AfterViewInit {
  @Input()
  duration: number = 500;

  @Input()
  underflow: boolean = false;

  @Input()
  overflow: boolean = false;

  @Input()
  /**
   * Scroll to bottom when scrolling up at the very top.
   */
  lockAt: number = 0;

  @Input()
  /**
   * Scroll to top when scrolling down at the very bottom.
   */
  lockUntil: number = 100;

  @Input()
  /**
   * An easing function that takes a normalized progress value [0, 1] and returns.
   * a normalized delta position [0, 1].
   * Defaults to a linear easing.
   * Take a look at d3-easing.
   */
  easingFn: (progress: number) => number = progress => progress;

  @Input()
  target: ElementRef = this.subject;

  @Input()
  wayPoints: QueryList<WayPointDirective>;

  @Output()
  scroll: EventEmitter<ViewedPoint[]> = new EventEmitter();

  @Output()
  focusChanged: EventEmitter<FocusChangedEvent> = new EventEmitter();

  private animation = 0;
  private progress = 0;
  private viewedPoint: ViewedPoint = { ref: null, percentage: 100, index: 0 };

  constructor(private subject: ElementRef) {}

  ngAfterContentInit() {
    window.addEventListener("wheel", this.onWheel.bind(this));
    this.subject.nativeElement.style.overflow = "hidden";
  }

  ngAfterViewInit() {}

  onWheel(e: WheelEvent) {
    if (
      e.target !== this.target.nativeElement &&
      !this.wayPoints.find(wayPoint => e.target === wayPoint.ref.nativeElement)
    ) {
      return;
    }

    if (this.animation) {
      if (this.progress > this.lockAt && this.progress < this.lockUntil) {
        return false;
      }
      cancelAnimationFrame(this.animation);
    }

    if (e.deltaY < 0) {
      this.previousPoint();
    } else if (e.deltaY > 0) {
      this.nextPoint();
    }
  }

  previousPoint() {
    const viewedPoints = this.getViewedPts();
    if (!viewedPoints.length) {
      return;
    }

    const currentPoint = viewedPoints[0];
    let nextIndex = currentPoint.index - 1;
    if (nextIndex === -1) {
      if (!this.overflow) {
        return;
      }
      nextIndex = 0;
    }
    if (
      currentPoint.percentage < 100 &&
      currentPoint.index > nextIndex &&
      !this.animation
    ) {
      nextIndex = currentPoint.index;
    }

    this.scrollIdx(nextIndex);
  }

  nextPoint() {
    const viewedPoints = this.getViewedPts();
    if (!viewedPoints.length) {
      return;
    }

    const currentPoint = viewedPoints[0];
    let nextIndex = currentPoint.index + 1;
    if (nextIndex === this.wayPoints.length) {
      if (!this.overflow) {
        return;
      }
      nextIndex = 0;
    }
    if (
      currentPoint.percentage < 100 &&
      currentPoint.index < nextIndex &&
      !this.animation
    ) {
      nextIndex = currentPoint.index;
    }

    this.scrollIdx(nextIndex);
  }

  getPos() {
    return this.subject.nativeElement.scrollTop;
  }

  /**
   * Scrolls to the desired scroll-point index
   */
  scrollIdx(index: number) {
    const viewedPoints = this.getViewedPts();
    if (
      viewedPoints.find((el: ViewedPoint) => {
        return el.index === index && el.percentage === 100;
      })
    ) {
      return;
    }

    const nextPoint = this.wayPoints.find((_, i) => i === index);
    const position = nextPoint.ref.nativeElement.offsetTop;

    this.scrollPos(position);
  }

  /**
   * Scrolls to the desired element, if it is a scroll-point
   */
  scrollEl(el: ElementRef) {
    const pt = this.wayPoints.find(item => {
      return item.ref.nativeElement === el;
    });
    if (!pt) {
      return;
    }

    this.scrollPt(pt);
  }

  /**
   * Scrolls to the desired scroll-point
   */
  scrollPt(pt: WayPointDirective) {
    const idx = this.wayPoints.toArray().findIndex(item => {
      return item === pt;
    });
    if (!idx) {
      return;
    }
    this.scrollIdx(idx);
  }

  scrollPos(position: number) {
    const start = this.getPos();
    const delta = position - start;
    if (delta === 0) {
      return;
    }
    let startTime: number = 0;

    const animate = (timestamp: number) => {
      const viewed = this.updateViewed();
      this.scroll.next(viewed);

      const progressTime = timestamp - startTime;
      let progressPercent = Math.floor((progressTime / this.duration) * 100);

      // Calculation errors occur sometimes
      if (progressPercent < 0) {
        progressPercent = -progressPercent;
      }
      this.progress = progressPercent;

      if (progressPercent > 100) {
        progressPercent = 100;
      }

      const easing = this.easingFn(progressPercent / 100);

      const position = start + easing * delta;

      this.move(position);

      if (progressPercent < 100) {
        this.animation = requestAnimationFrame(animate);
      } else {
        this.animation = 0;
        this.updateViewed();
      }
    };
    this.animation = requestAnimationFrame(() => {
      startTime = window.performance.now();
      animate(startTime);
    });
  }

  /**
   * Moves the scroll position to the desired amount
   */
  move(amount: number) {
    this.subject.nativeElement.scrollTop = amount;
  }

  /**
   * Determines how much of an element is inside the viewport.
   * If the viewport is entirely covered by the element, it returns 100%.
   */
  viewedPercent(el: ElementRef) {
    const hostScrollPosition = this.getPos();
    const hostHeight = this.subject.nativeElement.clientHeight;

    const childOffset = el.nativeElement.offsetTop;
    const childHeight = el.nativeElement.clientHeight;

    const spaceTop = childOffset - hostScrollPosition;
    const scrollBottom = hostScrollPosition + hostHeight;

    const bottomChild = childOffset + el.nativeElement.clientHeight;
    const spaceBottom = bottomChild - scrollBottom;
    let heightInScreen = childHeight - spaceBottom;

    if (spaceTop < 0) {
      heightInScreen -= spaceTop * -1;
    }

    if (spaceBottom < 0) {
      heightInScreen -= spaceBottom * -1;
    }

    let percentage = (heightInScreen / hostHeight) * 100;
    percentage = percentage < 0 ? 0 : percentage;
    return percentage;
  }

  /**
   * Returns the scroll points inside the current viewport.
   * Least amount comes last.
   */
  getViewedPts(): ViewedPoint[] {
    return this.wayPoints
      .map((el, index) => {
        return { percentage: this.viewedPercent(el.ref), ref: el.ref, index };
      })
      .filter(el => el.percentage > 0)
      .sort((a, b) => {
        if (a.percentage > b.percentage) return -1;
        if (b.percentage > a.percentage) return 1;
        return 0;
      });
  }

  /**
   * Determines the element with greatest containment inside the viewport
   * and fires the focusChanged event if it differs from the previous update.
   *
   * Returns the currently viewed points.
   */
  updateViewed() {
    const viewedPoints = this.getViewedPts();
    if (!viewedPoints) {
      throw new Error();
    }
    /* if (!viewedPoints.length) {
      return;
    } */

    if (viewedPoints[0].index !== this.viewedPoint.index) {
      this.focusChanged.emit({
        previous: this.viewedPoint,
        current: viewedPoints[0]
      });
      this.viewedPoint = viewedPoints[0];
    }
    return viewedPoints;
  }
}
