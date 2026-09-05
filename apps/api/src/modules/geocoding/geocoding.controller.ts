import { Body, Controller, Post, ServiceUnavailableException, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { reverseGeocodeSchema, ReverseGeocodeInput } from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { GeocodingService } from "./geocoding.service";

// Any authenticated role may reverse-geocode — customer (address entry),
// restaurant owner (profile location), driver (future use). No sensitive data
// is returned or required, so no @Roles() restriction beyond being logged in.
@ApiTags("geocoding")
@UseGuards(JwtAuthGuard)
@Controller("geocoding")
export class GeocodingController {
  constructor(private readonly geocoding: GeocodingService) {}

  @Post("reverse")
  async reverse(@Body(new ZodValidationPipe(reverseGeocodeSchema)) body: ReverseGeocodeInput) {
    try {
      return await this.geocoding.reverseGeocode(body.lat, body.lng);
    } catch {
      throw new ServiceUnavailableException(
        "Could not resolve an address for this location. Please enter it manually.",
      );
    }
  }
}
