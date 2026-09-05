import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { AddressInput } from "@quickbite/validation";
import { AddressEntity, UserEntity } from "../../database/entities";

// Fields a user may edit about themselves. Previously this accepted the raw
// request body as Partial<UserEntity> with zero whitelist — a caller could
// PATCH role/isActive/walletBalance directly on their own account. Every
// other write to those fields already goes through a dedicated, authorized
// path (AdminService.suspendUser, wallet credit logic, etc.); self-service
// profile edits should never be able to touch them.
const EDITABLE_FIELDS = ["name", "phone", "avatarUrl"] as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(AddressEntity)
    private readonly addresses: Repository<AddressEntity>,
  ) {}

  async updateProfile(userId: string, patch: Record<string, unknown>) {
    const safePatch: Partial<UserEntity> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in patch) (safePatch as any)[field] = patch[field];
    }
    await this.users.update(userId, safePatch);
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    const { passwordHash, refreshTokenHash, ...rest } = user as any;
    return rest;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException("New password must be at least 8 characters");
    }
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.id = :id", { id: userId })
      .getOne();
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException("Current password is incorrect");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.users.update(userId, { passwordHash });
    return { success: true };
  }

  listAddresses(userId: string) {
    return this.addresses.find({ where: { userId }, order: { createdAt: "DESC" } });
  }

  async createAddress(userId: string, input: AddressInput) {
    if (input.isDefault) {
      await this.addresses.update({ userId }, { isDefault: false });
    }
    return this.addresses.save(this.addresses.create({ ...input, userId }));
  }

  async deleteAddress(userId: string, addressId: string) {
    const addr = await this.addresses.findOne({ where: { id: addressId, userId } });
    if (!addr) throw new NotFoundException("Address not found");
    await this.addresses.delete(addressId);
    return { success: true };
  }
}
