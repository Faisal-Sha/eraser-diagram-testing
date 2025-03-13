import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class AppService {
  private customContentStyle: Record<string, any> = {};

  /**
   * Sets the custom content style properties.
   *
   * @param customContentStyle A record containing the custom content style properties.
   *
   * @example
   */
  public setCustomContentStyle(customContentStyle: Record<string, any>): void {
    this.customContentStyle = customContentStyle;
  }

  /**
   * Retrieves the custom content style object set in the service.
   *
   * @returns A record containing the custom content style properties.
   *
   * @example
   * ```typescript
   * const customStyle = this.appService.getCustomContentStyle();
   * console.log(customStyle); // { 'font-size': '16px', 'color': 'red' }
   * ```
   */
  public getCustomContentStyle(): Record<string, any> {
    return this.customContentStyle;
  }

}


