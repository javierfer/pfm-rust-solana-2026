"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRole } from "@/lib/hooks/useRole";

export default function DashboardPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { role, hasPendingRequest, isAuthority, loading } = useRole();

  useEffect(() => {
    if (loading) return;

    if (!publicKey) {
      router.push("/");
      return;
    }

    // Redirect based on role
    if (isAuthority) {
      router.push("/dashboard/authority/initialize");
    } else if (role === "producer") {
      router.push("/dashboard/producer");
    } else if (role === "factory") {
      router.push("/dashboard/factory");
    } else if (role === "retailer") {
      router.push("/dashboard/retailer");
    } else if (role === "consumer") {
      router.push("/dashboard/consumer");
    } else if (hasPendingRequest) {
      router.push("/register-role");
    } else {
      router.push("/register-role");
    }
  }, [publicKey, role, hasPendingRequest, isAuthority, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-gray-600">Loading dashboard...</div>
    </div>
  );
}
