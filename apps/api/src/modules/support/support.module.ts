import { Module } from "@nestjs/common";
import { SupportController } from "./support.controller";
import { HelpingAgentService } from "./helping-agent.service";
import { FaqEngine } from "./faq-engine";

@Module({
  controllers: [SupportController],
  providers: [HelpingAgentService, FaqEngine],
})
export class SupportModule {}
