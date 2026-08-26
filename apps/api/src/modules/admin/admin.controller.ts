import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@quickbite/types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("dashboard")
  dashboard() {
    return this.admin.dashboard();
  }

  @Get("restaurants")
  restaurants() {
    return this.admin.listRestaurants();
  }

  @Post("restaurants/:id/approve")
  approve(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.admin.approveRestaurant(id, user.userId);
  }

  @Post("restaurants/:id/suspend")
  suspend(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.admin.suspendRestaurant(id, user.userId);
  }

  @Get("orders")
  orders() {
    return this.admin.listOrders();
  }

  @Get("customers")
  customers() {
    return this.admin.listCustomers();
  }

  @Get("drivers")
  drivers() {
    return this.admin.listDrivers();
  }

  @Get("deliveries/active")
  activeDeliveries() {
    return this.admin.activeDeliveries();
  }

  @Get("audit-log")
  auditLog() {
    return this.admin.auditLog();
  }
}
