const ONE_WEEK = 60 * 60 * 24 * 7;
const ONE_MONTH = 60 * 60 * 24 * 30;

export const CART_COOKIE = "brand_cart";
export const USER_COOKIE = "brand_user";
export const CHECKOUT_COOKIE = "brand_checkout";
export const LAST_USER_COOKIE = "brand_last_user";
export const ACCESS_TOKEN_COOKIE = "brand_access_token";
export const REFRESH_TOKEN_COOKIE = "brand_refresh_token";

export function setCookie(name: string, value: string, maxAge = ONE_WEEK) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function getCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const cookieRow = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookieRow ? decodeURIComponent(cookieRow.split("=").slice(1).join("=")) : "";
}

export function removeCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export function deleteCookie(name: string) {
  removeCookie(name);
}
