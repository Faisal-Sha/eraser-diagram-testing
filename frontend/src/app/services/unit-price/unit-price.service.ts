import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class UnitPriceService {
  private _isUnitPriceViewActive: boolean = false;

  /**
   * Checks if the unit price view is currently active.
   *
   * @returns {boolean} Whether the unit price view is active.
   */
  public get isUnitPriceViewActive() {
    return this._isUnitPriceViewActive;
  }

  /**
   * Toggles the unit price view.
   *
   * When the unit price view is active, it displays the unit price next to the
   * quantity input. When the unit price view is inactive, the unit price is not
   * displayed.
   */
  toggleUnitPriceView() {
    this._isUnitPriceViewActive = !this._isUnitPriceViewActive;
  }
}
