import { EventAnimation } from "@/components/event-animation/event-animation";
import { getEffectiveEventTheme } from "@/components/event-animation/effective-theme";
import { CarritoPageClient } from "./carrito-page-client";

export default async function CarritoPage() {
  const theme = await getEffectiveEventTheme();

  return (
    <>
      <EventAnimation theme={theme} />
      <CarritoPageClient />
    </>
  );
}
