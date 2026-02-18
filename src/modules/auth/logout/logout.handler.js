import { clearAuthCookie } from '../../../auth/session.js';

export default async function logoutHandler(c) {
  clearAuthCookie(c);
  return {
    ok: true,
  };
}
