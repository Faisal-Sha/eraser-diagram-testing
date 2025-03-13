import { animate, style, transition, trigger } from "@angular/animations";

export const fadeInOutAnimation = trigger('fadeInOut', [
  transition(':enter', [
    style({
      height: '0',
      opacity: 0,
      paddingTop: '0',
      paddingBottom: '0',
      marginTop: '0',
      marginBottom: '0'
    }),
    animate('300ms ease-out', style({
      height: '*',
      opacity: 1,
      paddingTop: '*',
      paddingBottom: '*',
      marginTop: '*',
      marginBottom: '*'
    }))
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({
      height: '0',
      opacity: 0,
      paddingTop: '0',
      paddingBottom: '0',
      marginTop: '0',
      marginBottom: '0'
    }))
  ])
]);
