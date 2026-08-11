import { EventAnimation } from "@/components/event-animation/event-animation";
import { getEffectiveEventTheme } from "@/components/event-animation/effective-theme";
import { CheckoutPageClient } from "./checkout-page-client";

export default async function CheckoutPage() {
  const theme = await getEffectiveEventTheme();

  return (
    <>
      <EventAnimation theme={theme} />
      <CheckoutPageClient />
    </>
  );
}
