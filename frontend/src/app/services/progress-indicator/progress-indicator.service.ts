import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ProgressIndicatorService {
  public statusSubject$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  /**
   * Activates the progress indicator.
   *
   * This method sets the value of the `statusSubject$` to `true`, indicating that the progress indicator should be shown.
   *
   * @returns {void}
   */

  public activate() {
    this.statusSubject$.next(true);
  }

  /**
   * Deactivates the progress indicator.
   *
   * This method sets the value of the `statusSubject$` to `false`, indicating that the progress indicator should be hidden.
   *
   * @returns {void}
   */
  public deactivate() {
    this.statusSubject$.next(false);
  }
}