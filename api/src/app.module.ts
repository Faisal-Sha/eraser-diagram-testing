import { Module, OnModuleInit } from '@nestjs/common';
import { CsvModule } from 'nest-csv-parser'
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { join } from 'path';

import { CalculationController } from './controller/calculation/calculation.controller';
import { SuggestionController } from './controller/suggestion/suggestion.controller';

import { MaterialCalculateService } from './services/material-calculate/material-calculate.service';
import { EffordCalculateService } from './services/efford-calculate/efford-calculate.service';
import { SuggestionService } from './services/suggestion/suggestion.service';
import { PipeFittingService } from './services/pipe-fitting/pipe-fitting.service';

@Module({
  imports: [
    I18nModule.forRootAsync({
      /**
       * Factory function to initialize the i18n module. It returns an options
       * object that configures the i18n module to use the translation files in
       * the `i18n` directory, to watch for changes to the files, and to use the
       * german language as a fallback if no better match is found.
       */
      useFactory: () => ({
        fallbackLanguage: 'de',
        loaderOptions: {
          path: join(__dirname, '/i18n/'),
          watch: true,
        },
      }),
      resolvers: [AcceptLanguageResolver],
    }),
    CsvModule,
  ],
  controllers: [CalculationController, SuggestionController],
  providers: [
    MaterialCalculateService,
    EffordCalculateService,
    SuggestionService,
    PipeFittingService,
  ]
})
export class AppModule implements OnModuleInit {
  constructor(private pipeFittingService: PipeFittingService) {}

  /**
   * Initializes the application module by parsing pipe fitting data.
   *
   * This method is called when the module is initialized. It uses the `PipeFittingService`
   * to parse the pipe fitting data asynchronously.
   *
   * @returns {Promise<void>} A promise that resolves when the parsing is complete.
   */
  async onModuleInit() {
    await this.pipeFittingService.parse();
  }
}
