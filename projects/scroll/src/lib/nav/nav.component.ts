import {
  Component,
  OnInit,
  Input,
  Output,
  OnChanges,
  EventEmitter,
  SimpleChanges
} from "@angular/core";

@Component({
  selector: "opa-nav",
  templateUrl: "nav.component.html",
  styleUrls: ["nav.component.css"]
})
export class NavComponent implements OnInit, OnChanges {
  @Input()
  selection: number = 0;

  @Input()
  count: number = 0;

  @Input()
  pos: string = 'right';

  @Output()
  selected: EventEmitter<number> = new EventEmitter();

  _count = new Array(0);

  constructor() {}

  ngOnInit() {
    this._count = new Array(this.count);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.count) {
      this._count = new Array(changes.count.currentValue);
    }
  }

  onClick(event, index) {
    this.selected.emit(index);
  }
}
