
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SafeUrlPipe } from 'src/app/pipes/safe-url.pipe';

@Component({
    selector: 'app-page-home',
    templateUrl: './docs.component.html',
    styleUrls: ['./docs.component.scss'],
    standalone: true,
    imports: [SafeUrlPipe]
})
export class DocsComponent implements OnInit, AfterViewInit {

  docsUrl: string = 'assets/docs/frontend/index.html'; // Default to frontend docs

  constructor(private sanitizer: DomSanitizer, private router: Router) {
    // Default to frontend docs
    // this.docsUrl = this.sanitizer.bypassSecurityTrustResourceUrl('assets/docs/frontend/index.html');
  }

  /**
   * This lifecycle hook is called after the component's view has been fully initialized.
   * At this point, the component's template is available and all child components have been initialized.
   * This is the best place to perform all initialization that require the component's view to be available.
   *
   * <i>Angular calls this hook after the component's view has been fully initialized.</i>
   */
  ngAfterViewInit(): void {
  }

  /**
   * This lifecycle hook is called after the component's properties have been initialized.
   * At this point, the component's properties are available and can be modified.
   * This is the best place to perform all initialization that require the component's properties to be available.
   *
   * <i>Angular calls this hook after the component's properties have been initialized.</i>
   */
  ngOnInit(): void {
  }


  updateDocs(event: Event) {
    const selectedUrl = (event.target as HTMLSelectElement).value;
    // this.docsUrl = this.sanitizer.bypassSecurityTrustResourceUrl(selectedUrl);
    this.docsUrl = selectedUrl;
  }

  goBackHome() {
    this.router.navigate(['/']);
  }
}
