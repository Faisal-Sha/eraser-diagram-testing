import { I18nService } from "nestjs-i18n";
import { PipeFittingService } from "../services/pipe-fitting/pipe-fitting.service";

export interface SuggestionServiceContainer {
  pipeFittingService: PipeFittingService;
  i18nService: I18nService;
}