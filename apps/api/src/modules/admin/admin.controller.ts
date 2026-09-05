import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@quickbite/types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { RefundsService } from "../refunds/refunds.service";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly refunds: RefundsService,
  ) {}

  // ── Dashboard / Analytics ──────────────────────────────────────────────

  @Get("dashboard")
  dashboard() {
    return this.admin.dashboard();
  }

  @Get("analytics/revenue")
  revenueAnalytics(
    @Query("range") range: "today" | "7d" | "30d" | "month" | "custom" = "30d",
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.admin.revenueAnalytics(range, from, to);
  }

  @Get("reports/financial")
  financialReport(@Query("from") from: string, @Query("to") to: string) {
    return this.admin.financialReport(from, to);
  }

  // ── Orders ───────────────────────────────────────────────────────────────

  @Get("orders")
  orders(
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("sortBy") sortBy?: "newest" | "oldest" | "highest" | "lowest",
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.admin.listOrdersFiltered({
      status,
      search,
      sortBy,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get("orders/:id")
  orderDetail(@Param("id") id: string) {
    return this.admin.getOrderDetail(id);
  }

  // ── Payments ─────────────────────────────────────────────────────────────

  @Get("payments")
  payments(
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.admin.listPayments({
      status,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  // ── Refunds ──────────────────────────────────────────────────────────────

  @Get("refunds")
  listRefunds(@Query("status") status?: string, @Query("search") search?: string) {
    return this.refunds.list({ status: status as any, search });
  }

  @Get("refunds/:id")
  getRefund(@Param("id") id: string) {
    return this.refunds.get(id);
  }

  @Post("orders/:id/refund")
  createRefund(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body("reason") reason: string,
    @Body("refundAmount") refundAmount?: number,
  ) {
    return this.refunds.request(id, user as any, reason, refundAmount);
  }

  @Post("refunds/:id/approve")
  approveRefund(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.refunds.approve(id, user.userId);
  }

  @Post("refunds/:id/reject")
  rejectRefund(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body("note") note: string,
  ) {
    return this.refunds.reject(id, user.userId, note);
  }

  @Post("refunds/:id/process")
  processRefund(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body("adminNote") adminNote?: string,
  ) {
    return this.refunds.process(id, user.userId, adminNote);
  }

  // ── Coupons & Offers ─────────────────────────────────────────────────────

  @Get("coupons")
  coupons(@Query("scope") scope?: "platform" | "restaurant") {
    return this.admin.listCoupons(scope);
  }

  // ── Restaurants ──────────────────────────────────────────────────────────

  @Get("restaurants")
  restaurants() {
    return this.admin.listRestaurants();
  }

  @Get("restaurants/:id")
  restaurantDetail(@Param("id") id: string) {
    return this.admin.restaurantDetail(id);
  }

  @Post("restaurants/:id/approve")
  approve(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.admin.approveRestaurant(id, user.userId);
  }

  @Post("restaurants/:id/suspend")
  suspend(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.admin.suspendRestaurant(id, user.userId);
  }

  // ── Drivers ──────────────────────────────────────────────────────────────

  @Get("drivers")
  drivers() {
    return this.admin.listDrivers();
  }

  @Get("drivers/:userId")
  driverDetail(@Param("userId") userId: string) {
    return this.admin.driverDetail(userId);
  }

  // ── Customers ────────────────────────────────────────────────────────────

  @Get("customers")
  customers() {
    return this.admin.listCustomers();
  }

  @Get("customers/:id")
  customerDetail(@Param("id") id: string) {
    return this.admin.customerDetail(id);
  }

  // ── Generic account suspension (customers & drivers; restaurants use their
  // own approve/suspend above since that's a distinct operating-status flow) ─

  @Post("users/:id/suspend")
  suspendUser(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.admin.suspendUser(id, user.userId);
  }

  @Post("users/:id/activate")
  activateUser(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.admin.activateUser(id, user.userId);
  }

  // ── Reviews ──────────────────────────────────────────────────────────────

  @Get("reviews")
  reviews(@Query("visible") visible?: "visible" | "hidden") {
    return this.admin.listReviews({ visible });
  }

  @Patch("reviews/:id/visibility")
  setReviewVisibility(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body("isHidden") isHidden: boolean,
  ) {
    return this.admin.setReviewVisibility(id, isHidden, user.userId);
  }

  // ── Live Operations ──────────────────────────────────────────────────────

  @Get("deliveries/active")
  activeDeliveries() {
    return this.admin.activeDeliveries();
  }

  // ── Global Search ────────────────────────────────────────────────────────

  @Get("search")
  search(@Query("q") q: string) {
    return this.admin.globalSearch(q);
  }

  // ── Audit Log ────────────────────────────────────────────────────────────

  @Get("audit-log")
  auditLog() {
    return this.admin.auditLog();
  }
}
