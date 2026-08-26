import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { reviewSchema } from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { ReviewsService } from "./reviews.service";

@ApiTags("reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(reviewSchema)) body: ReturnType<typeof reviewSchema.parse>,
  ) {
    return this.reviews.create(user.userId, body);
  }

  @Get("restaurant/:id")
  forRestaurant(@Param("id") id: string) {
    return this.reviews.forRestaurant(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/reply")
  reply(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body("reply") reply: string,
  ) {
    return this.reviews.reply(id, user as any, reply);
  }
}
