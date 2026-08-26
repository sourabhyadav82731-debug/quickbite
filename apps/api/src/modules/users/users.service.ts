import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AddressInput } from "@quickbite/validation";
import { AddressEntity, UserEntity } from "../../database/entities";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(AddressEntity)
    private readonly addresses: Repository<AddressEntity>,
  ) {}

  async updateProfile(userId: string, patch: Partial<UserEntity>) {
    await this.users.update(userId, patch);
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    const { passwordHash, refreshTokenHash, ...rest } = user as any;
    return rest;
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
