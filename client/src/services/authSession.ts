type LogoutHandler = () => void;

let logoutHandler: LogoutHandler | null = null;
let authBootstrapRunning = false;

export function registerAuthLogoutHandler(handler: LogoutHandler) {
  logoutHandler = handler;
}

export function runAuthLogout() {
  logoutHandler?.();
}

export function setAuthBootstrapRunning(running: boolean) {
  authBootstrapRunning = running;
}

export function getIsAuthBootstrapRunning() {
  return authBootstrapRunning;
}
