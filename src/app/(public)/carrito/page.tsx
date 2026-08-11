import { EventAnimation } from "@/components/event-animation/event-animation";
import { getEffectiveEventTheme } from "@/components/event-animation/effective-theme";
import { CarritoPageClient } from "./carrito-page-client";

// Without this, Next has no dynamic-API signal here (getEffectiveEventTheme
// goes through the Supabase JS client, not Next's instrumented fetch()) and
// prerenders this page as static at build time — baking in whatever the
// event theme happened to be during that build, never reflecting a later
// admin change without a full redeploy.
export const dynamic = "force-dynamic";

export default async function CarritoPage() {
  const theme = await getEffectiveEventTheme();

  return (
    <>
      <EventAnimation theme={theme} />
      <CarritoPageClient />
    </>
  );
}
