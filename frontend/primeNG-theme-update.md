# PrimeNG Theming with SASS

-> Clone or download the latest "lara-light-green" theme from the PrimeNG GitHub repository 
   (https://github.com/primefaces/primeng-sass-theme/).

-> Update "src/styles/primeng-sass-theme/theme-base" and "src/styles/primeng-sass-theme/themes" 
   from new downloaded version

-> We have given the path in angular.json file where you want to put the folder 
   (primeng-sass-theme).
   Example :- "src/styles/primeng-sass-theme/themes/lara/lara-light/green/theme.scss"

-> Also,import the theme in styles.scss in order to work with primengtheme properly.
   Example :- @import "./primeng-sass-theme/themes/lara/lara-light/green/theme.scss";
   
-> In theme.scss file (Path :- "frontend/src/styles/primeng-sass-theme/themes/lara/lara-light/
   green/theme.scss")
   
   Currently, we have customized below colors according to requirement :-
   Example :- 
   $primaryColor: #006a34 !default; /* Custom Color Change*/
   $primaryLightColor: rgba(0, 106, 52, 0.24) !default; /* Custom Color Change*/
   $primaryDarkColor: #006a34 !default; /* Custom Color Change*/
   $primaryDarkerColor: #006a34 !default; /* Custom Color Change*/
   $primaryTextColor: #ffffff !default;

   $highlightBg: rgba(0, 106, 52, 0.12) !default; /* Custom BgColor Change*/
   $highlightTextColor: $primaryDarkerColor !default;
   $highlightFocusBg: rgba($primaryColor, .24) !default; /* Custom BgFocusColor Change*/







