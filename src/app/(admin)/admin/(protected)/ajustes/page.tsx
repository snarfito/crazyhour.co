import { getSettings } from "@/lib/settings";
import { updateSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AjustesPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-md">
      <h1 className="font-heading text-2xl font-extrabold">Ajustes</h1>
      <form action={updateSettings} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="whatsapp_number">Número de WhatsApp</Label>
          <Input id="whatsapp_number" name="whatsapp_number" defaultValue={settings.whatsappNumber} required />
          <p className="mt-1 text-xs text-muted-foreground">Formato internacional sin &quot;+&quot;, ej: 573001234567</p>
        </div>
        <div>
          <Label htmlFor="contact_email">Correo de contacto</Label>
          <Input id="contact_email" name="contact_email" type="email" defaultValue={settings.contactEmail ?? ""} />
        </div>
        <div>
          <Label htmlFor="contact_phone">Teléfono de contacto</Label>
          <Input id="contact_phone" name="contact_phone" defaultValue={settings.contactPhone ?? ""} />
        </div>
        <Button type="submit">Guardar</Button>
      </form>
    </div>
  );
}
