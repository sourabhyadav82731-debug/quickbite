import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@quickbite/types";
import { assistantRequestSchema, AssistantRequestInput } from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { HelpingAgentService } from "./helping-agent.service";

@ApiTags("support")
@UseGuards(JwtAuthGuard)
@Controller("support")
export class SupportController {
  constructor(private readonly agent: HelpingAgentService) {}

  @Post("assistant")
  ask(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(assistantRequestSchema)) body: AssistantRequestInput,
  ) {
    // body.role (if present) is client-supplied and intentionally ignored —
    // the only role ever used for content selection is the one on the
    // authenticated JWT, so a customer can never fish for restaurant/driver/
    // admin help content by lying about their role in the request body.
    return this.agent.respond(user.role as UserRole, body.language, body.message, body.context);
  }

  @Get("assistant/greeting")
  greeting(@Query("language") language = "en") {
    return { message: this.agent.greeting(language) };
  }
}
