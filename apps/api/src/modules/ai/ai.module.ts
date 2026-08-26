import { Body, Controller, Module, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

const CANNED_REPLIES: Record<string, string[]> = {
  restaurant: [
    "Your Butter Chicken has the highest margin this week — consider featuring it in a combo.",
    "Demand forecast: expect a 20% order spike this Friday evening based on historical patterns.",
    "3 dishes have low reorder rates. Consider a price or photo refresh for those items.",
  ],
  delivery: [
    "Taking the ring-road route saves ~4 minutes during evening peak hours.",
    "You're 3 trips away from today's ₹250 milestone bonus.",
    "Fuel-efficiency tip: batch nearby drop-offs when two offers arrive close together.",
  ],
};

// Placeholder for a real LLM-backed copilot. Returns a canned, role-appropriate
// response so the assistant UI has something real to render against.
@ApiTags("ai")
@UseGuards(JwtAuthGuard)
@Controller("ai")
export class AiController {
  @Post("copilot")
  ask(@Body("portal") portal: string) {
    const pool = CANNED_REPLIES[portal] ?? [
      "This assistant is a placeholder in the current build — deeper AI features are planned for a future pass.",
    ];
    const reply = pool[Math.floor(Math.random() * pool.length)];
    return { reply };
  }
}

@Module({ controllers: [AiController] })
export class AiModule {}
