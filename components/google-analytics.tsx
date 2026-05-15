import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js) loaded only when a measurement ID is provided.
 * Uses next/script with afterInteractive strategy so it doesn't block first paint.
 *
 * Render this in the root layout. It outputs nothing visible.
 */
export function GoogleAnalytics({ measurementId }: { measurementId: string | null | undefined }) {
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', { send_page_view: true });`}
      </Script>
    </>
  );
}
