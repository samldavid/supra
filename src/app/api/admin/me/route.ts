import { NextResponse } from "next/server";

import { getAdminStatus } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getAdminStatus();
  return NextResponse.json(status, { status: status.isAdmin ? 200 : status.isAuthenticated ? 403 : 401 });
}
