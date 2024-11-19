import { Component } from '@angular/core';
import { BlinkDirective } from '../../directivas/blink.directive';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [BlinkDirective],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.css'
})
export class PageNotFoundComponent {

}
