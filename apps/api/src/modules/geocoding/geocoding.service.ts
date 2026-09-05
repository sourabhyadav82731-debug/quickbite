import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ReverseGeocodeResult } from "@quickbite/types";
import { GeocodingProvider, NominatimProvider, OpenCageProvider } from "./geocoding.providers";

// Provider is chosen once at startup from env, never hard-coded — this is the
// "configurable geocoding provider" the feature spec requires. Defaults to
// Nominatim (free, no key) so the feature works out of the box; set
// GEOCODING_PROVIDER=opencage + GEOCODING_API_KEY for a production-grade provider.
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly provider: GeocodingProvider;

  constructor(config: ConfigService) {
    const providerName = (config.get<string>("GEOCODING_PROVIDER") ?? "nominatim").toLowerCase();
    const apiKey = config.get<string>("GEOCODING_API_KEY");

    if (providerName === "opencage" && apiKey) {
      this.provider = new OpenCageProvider(apiKey);
    } else {
      if (providerName !== "nominatim" && providerName !== "") {
        this.logger.warn(
          `GEOCODING_PROVIDER="${providerName}" not recognized or missing GEOCODING_API_KEY — falling back to Nominatim.`,
        );
      }
      this.provider = new NominatimProvider();
    }
  }

  reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    return this.provider.reverseGeocode(lat, lng);
  }
}
