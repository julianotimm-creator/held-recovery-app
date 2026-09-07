declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const trackSignUpConversion = () => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: "AW-315739934/Jw63COKGzfACEOnT-85E",
    });
  }
};
