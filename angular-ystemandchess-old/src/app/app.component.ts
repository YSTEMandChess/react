/**
 * Root Application Component
 * 
 * This is the main Angular component that serves as the root of the application.
 * It defines the app's title and initializes core services.
 * 
 * @deprecated This is the old Angular version of the application.
 * The project is being migrated to React (see react-ystemandchess directory).
 */

import { CookieService } from 'ngx-cookie-service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  /**
   * Constructor injects the cookie service for authentication management
   */
  constructor(cookie: CookieService) {}

  // Application title displayed in the browser
  title = 'YStemAndChess';
  
  /**
   * Lifecycle hook for component initialization
   * Currently not implemented but available for future use
   */
  ngInit() {}
}
