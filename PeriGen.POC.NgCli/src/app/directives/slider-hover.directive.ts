import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[pgSliderHover]'
})
export class SliderHoverDirective {

  // Callback function
  @Input() pgSliderHover: Function; 

  @HostListener('mouseenter') onMouseEnter() {
    console.log('mouseenter');
  }

  @HostListener('mouseleave') onMouseLeave() {
    console.log('mouseleave');
  }

  constructor(el: ElementRef) {
    console.log('constructed pgSliderHover!');
    var aTag = document.createElement('a');
    aTag.onclick = () => {
      return this.pgSliderHover;
    };
    el.nativeElement.appendChild("");
  }
}
