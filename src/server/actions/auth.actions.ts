"use server";

// TODO: US-1.1
// Placeholder Server Actions untuk Autentikasi Admin

export interface LoginActionResult {
  success: boolean;
  message?: string;
}

export async function loginAction(): Promise<LoginActionResult> {
  // Placeholder untuk autentikasi Credentials via Auth.js
  return {
    success: true,
    message: "Placeholder login action",
  };
}

export async function logoutAction(): Promise<{ success: boolean }> {
  // Placeholder logout action
  return {
    success: true,
  };
}
