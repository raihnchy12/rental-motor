import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  beforeSend(event) {
    // Sanitasi data pribadi / sensitif (No HP, KTP, SIM, Cookie, Auth)
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    if (event.exception?.values) {
      event.exception.values.forEach((ex) => {
        if (ex.value) {
          ex.value = ex.value
            .replace(/(\b\d{10,16}\b)/g, "[REDACTED_NUMBER]")
            .replace(/(\b\d{16}\b)/g, "[REDACTED_NIK]");
        }
      });
    }
    return event;
  },
});
