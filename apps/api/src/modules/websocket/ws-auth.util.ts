import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Socket } from "socket.io";

export interface SocketUser {
  userId: string;
  role: string;
}

export async function authenticateSocket(
  socket: Socket,
  jwt: JwtService,
  config: ConfigService,
): Promise<SocketUser | null> {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return null;
  try {
    const payload = await jwt.verifyAsync(token, {
      secret: config.get<string>("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
    });
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
