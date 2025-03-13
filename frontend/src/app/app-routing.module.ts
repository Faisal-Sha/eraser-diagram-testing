import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './components/pages/home/home.component';
import { PrintPageComponent } from './components/pages/print/print.component';
import { DocsComponent } from './components/pages/docs/docs.component';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'print', component: PrintPageComponent },
  { path: 'docs', component: DocsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
