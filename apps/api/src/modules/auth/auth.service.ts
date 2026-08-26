import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { UserRole } from "@quickbite/types";
import { JWT_ACCESS_TTL, JWT_REFRESH_TTL } from "@quickbite/config";
import { LoginInput, RegisterInput } from "@quickbite/validation";
import { UserEntity } from "../../database/entities";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private accessSecret() {
    return this.config.get<string>(
      "JWT_ACCESS_SECRET",
      "dev-access-secret-change-me",
    );
  }
  private refreshSecret() {
    return this.config.get<string>(
      "JWT_REFRESH_SECRET",
      "dev-refresh-secret-change-me",
    );
  }

  private async issueTokens(user: UserEntity) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.accessSecret(),
      expiresIn: JWT_ACCESS_TTL,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.refreshSecret(),
      expiresIn: JWT_REFRESH_TTL,
    });
    await this.users.update(user.id, {
      refreshTokenHash: await bcrypt.hash(refreshToken, 10),
    });
    return { accessToken, refreshToken };
  }

  async register(input: RegisterInput) {
    const existing = await this.users.findOne({
      where: { email: input.email },
    });
    if (existing) throw new ConflictException("Email already registered");

    const user = await this.users.save(
      this.users.create({
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role ?? UserRole.CUSTOMER,
        passwordHash: await bcrypt.hash(input.password, 10),
      }),
    );
    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.sanitize(user) };
  }

  async login(input: LoginInput) {
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email: input.email })
      .getOne();

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const tokens = await this.issueTokens(user);
    return { ...tokens, user: this.sanitize(user) };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect("user.refreshTokenHash")
      .where("user.id = :id", { id: payload.sub })
      .getOne();

    if (
      !user?.refreshTokenHash ||
      !(await bcrypt.compare(refreshToken, user.refreshTokenHash))
    ) {
      throw new UnauthorizedException("Refresh token no longer valid");
    }
    return this.issueTokens(user);
  }

  async me(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  private sanitize(user: UserEntity) {
    const { passwordHash, refreshTokenHash, ...rest } = user as any;
    return rest;
  }
}
