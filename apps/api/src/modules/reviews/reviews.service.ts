import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRole } from "@quickbite/types";
import { ReviewInput } from "@quickbite/validation";
import { RestaurantEntity, ReviewEntity } from "../../database/entities";

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity) private readonly reviews: Repository<ReviewEntity>,
    @InjectRepository(RestaurantEntity)
    private readonly restaurants: Repository<RestaurantEntity>,
  ) {}

  create(authorId: string, input: ReviewInput) {
    return this.reviews.save(this.reviews.create({ ...input, authorId }));
  }

  forRestaurant(restaurantId: string) {
    return this.reviews.find({ where: { restaurantId }, order: { createdAt: "DESC" } });
  }

  async reply(
    reviewId: string,
    actor: { userId: string; role: UserRole },
    reply: string,
  ) {
    const review = await this.reviews.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException("Review not found");
    if (review.restaurantId) {
      const restaurant = await this.restaurants.findOne({
        where: { id: review.restaurantId },
      });
      if (restaurant?.ownerId !== actor.userId && actor.role !== UserRole.ADMIN) {
        throw new ForbiddenException("Not your restaurant");
      }
    }
    await this.reviews.update(reviewId, { ownerReply: reply });
    return this.reviews.findOne({ where: { id: reviewId } });
  }
}
