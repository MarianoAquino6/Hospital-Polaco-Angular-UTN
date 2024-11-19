import { Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appBlink]',
  standalone: true
})
export class BlinkDirective {

  private isBlinking = true;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.toggleBlinking();
  }

  private toggleBlinking() {
    setInterval(() => {
      if (this.isBlinking) {
        this.renderer.setStyle(this.el.nativeElement, 'visibility', 'hidden');
      } else {
        this.renderer.setStyle(this.el.nativeElement, 'visibility', 'visible');
      }
      this.isBlinking = !this.isBlinking;
    }, 300);
  }
}
