// Lightweight GA4 helpers. Only active when VITE_GA_MEASUREMENT_ID is set.

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

let initialized = false;

export const isAnalyticsEnabled = () => Boolean(MEASUREMENT_ID);

export function initAnalytics() {
  if (initialized || !MEASUREMENT_ID || typeof window === "undefined") return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // Disable automatic page_view so we can emit on route change manually.
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });
}

export function trackPageView(path: string, title?: string) {
  if (!MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.origin + path,
    page_title: title ?? document.title,
    send_to: MEASUREMENT_ID,
  });
}

export function trackEvent(name: string, params: Record<string, any> = {}) {
  if (!MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

// Convenience helpers
export const trackPhoneClick = (params: Record<string, any> = {}) =>
  trackEvent("phone_click", params);
export const trackFaxClick = (params: Record<string, any> = {}) =>
  trackEvent("fax_click", params);
export const trackContactClick = (params: Record<string, any> = {}) =>
  trackEvent("contact_click", params);
export const trackClickToConnect = (params: Record<string, any> = {}) =>
  trackEvent("click_to_connect", params);
export const trackUltrasoundPageView = (params: Record<string, any> = {}) =>
  trackEvent("ultrasound_page_view", params);
export const trackExercisePageView = (params: Record<string, any> = {}) =>
  trackEvent("exercise_page_view", params);
