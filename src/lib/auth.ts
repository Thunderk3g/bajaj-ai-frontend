/** Simple in-memory auth store (cleared on page reload). */

const VALID_USERNAME = "ai.bajajmarketing";
const VALID_PASSWORD = "ai.bajajmarketing";

export interface AuthState {
  isAuthenticated: boolean;
}

let authState: AuthState = {
  isAuthenticated: false,
};

export function authenticate(username: string, password: string): boolean {
  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    authState.isAuthenticated = true;
    return true;
  }
  return false;
}

export function logout(): void {
  authState.isAuthenticated = false;
}

export function isAuthenticated(): boolean {
  return authState.isAuthenticated;
}
