"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CircuitBoard,
  Cpu,
  Fan,
  HardDrive,
  Layers,
  MemoryStick,
  MessageCircle,
  Send,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PhotoUpload } from "@/components/upgrade/PhotoUpload";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  COOLING_LABELS,
  SPEC_FIELDS,
  type CoolingType,
  type TradeInFormData,
} from "@/types/trade-in";

const iconMap = {
  cpu: Cpu,
  motherboard: CircuitBoard,
  memory: MemoryStick,
  "hard-drive": HardDrive,
  gpu: Layers,
  zap: Zap,
};

const emptyForm: TradeInFormData = {
  photo: "",
  processor: "",
  motherboard: "",
  ram: "",
  storage: "",
  gpu: "",
  psu: "",
  coolingType: "aire",
  coolingDetail: "",
  extras: "",
  name: "",
  phone: "",
  email: "",
};

const steps = [
  { num: "01", title: "Sube la foto", desc: "Componentes internos visibles" },
  { num: "02", title: "Detalla specs", desc: "Cada pieza por separado" },
  { num: "03", title: "Recibe valor", desc: "Te contactamos con tu oferta" },
];

export function UpgradeForm() {
  const [form, setForm] = useState<TradeInFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof TradeInFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-border bg-black px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-dark focus:border-cyan/50 focus:shadow-[0_0_0_3px_var(--color-cyan-glow)]";

  function updateField<K extends keyof TradeInFormData>(
    key: K,
    value: TradeInFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof TradeInFormData, string>> = {};

    if (!form.photo) next.photo = "Sube una foto de tu PC";
    if (!form.processor.trim()) next.processor = "Requerido";
    if (!form.motherboard.trim()) next.motherboard = "Requerido";
    if (!form.ram.trim()) next.ram = "Requerido";
    if (!form.storage.trim()) next.storage = "Requerido";
    if (!form.gpu.trim()) next.gpu = "Requerido";
    if (!form.psu.trim()) next.psu = "Requerido";
    if (!form.coolingDetail.trim()) next.coolingDetail = "Requerido";
    if (!form.name.trim()) next.name = "Requerido";
    if (!form.phone.trim()) next.phone = "Requerido";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const res = await fetch("/api/trade-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (res.ok) {
      setSubmitted(true);
    }
  }

  if (submitted) {
    const whatsappText = encodeURIComponent(
      `Hola ANTAS, envié una solicitud de valoración de mi PC.\n\n` +
        `Procesador: ${form.processor}\n` +
        `GPU: ${form.gpu}\n` +
        `RAM: ${form.ram}\n\n` +
        `Mi nombre: ${form.name}`,
    );

    return (
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 inline-flex rounded-full border border-cyan/20 bg-cyan/5 p-4">
            <CheckCircle2 className="h-10 w-10 text-cyan" />
          </div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Solicitud enviada
          </h1>
          <p className="mt-3 text-muted">
            Recibimos los datos de tu PC. Te contactaremos pronto con una
            valoración estimada para descontar de tu nueva ANTAS.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              href={`https://wa.me/${siteConfig.whatsapp}?text=${whatsappText}`}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Seguir por WhatsApp
            </Button>
            <Button href="/pcs" variant="secondary">
              Ver PCs disponibles
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className="relative overflow-hidden bg-background">
      <section className="border-b border-border py-12 sm:py-16">
        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-gold uppercase">
              ANTAS Trade-in
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Usa tu PC como{" "}
              <span className="text-gold">parte de pago</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Cuéntanos qué componentes tiene tu equipo actual y te damos una
              valoración para descontar de tu próxima PC ANTAS.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-border bg-surface-elevated/50 px-4 py-5 text-center backdrop-blur-sm"
              >
                <p className="text-xs font-medium text-cyan">{step.num}</p>
                <p className="mt-1 text-sm font-medium">{step.title}</p>
                <p className="mt-0.5 text-xs text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Form */}
      <section className="py-12 sm:py-16">
        <Container className="relative">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
            {/* Photo */}
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-2.5">
                  <Cpu className="h-5 w-5 text-cyan" />
                </div>
                <div>
                  <h2 className="font-semibold">Foto de tu PC</h2>
                  <p className="text-sm text-muted">
                    Muestra los componentes internos de tu PC.
                  </p>
                </div>
              </div>
              <PhotoUpload
                value={form.photo}
                onChange={(url) => updateField("photo", url)}
                error={errors.photo}
              />
            </div>

            {/* Specs */}
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-2.5">
                  <MemoryStick className="h-5 w-5 text-cyan" />
                </div>
                <div>
                  <h2 className="font-semibold">Especificaciones</h2>
                  <p className="text-sm text-muted">
                    Detalla cada componente por separado.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {SPEC_FIELDS.map((field) => {
                  const Icon = iconMap[field.icon];
                  const key = field.key;
                  return (
                    <div key={key}>
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Icon className="h-4 w-4 text-cyan" />
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={form[key]}
                        onChange={(e) => updateField(key, e.target.value)}
                        placeholder={field.placeholder}
                        className={cn(
                          inputClass,
                          errors[key] && "border-red-500/50",
                        )}
                      />
                      {errors[key] && (
                        <p className="mt-1 text-xs text-red-400">{errors[key]}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cooling */}
              <div className="mt-6 space-y-4 rounded-xl border border-border-subtle bg-black/40 p-5">
                <div className="flex items-center gap-2">
                  <Fan className="h-4 w-4 text-cyan" />
                  <h3 className="text-sm font-medium">Enfriamiento</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(Object.entries(COOLING_LABELS) as [CoolingType, string][]).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateField("coolingType", value)}
                        className={cn(
                          "rounded-full px-4 py-2 text-sm transition-all",
                          form.coolingType === value
                            ? "bg-cyan text-black shadow-[0_0_16px_var(--color-cyan-glow)]"
                            : "border border-border text-muted hover:border-cyan/30 hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs text-muted">
                    Modelo o descripción del cooler
                  </label>
                  <input
                    type="text"
                    value={form.coolingDetail}
                    onChange={(e) => updateField("coolingDetail", e.target.value)}
                    placeholder={
                      form.coolingType === "aire"
                        ? "Ej: Cooler Master Hyper 212"
                        : "Ej: NZXT Kraken 240mm"
                    }
                    className={cn(
                      inputClass,
                      errors.coolingDetail && "border-red-500/50",
                    )}
                  />
                  {errors.coolingDetail && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.coolingDetail}
                    </p>
                  )}
                </div>
              </div>

              {/* Extras */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-muted">
                  Otros componentes (opcional)
                </label>
                <textarea
                  value={form.extras}
                  onChange={(e) => updateField("extras", e.target.value)}
                  placeholder="Ej: WiFi card, RGB hub, capturadora..."
                  rows={3}
                  className={cn(inputClass, "resize-none")}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="font-semibold">Datos de contacto</h2>
                <p className="text-sm text-muted">
                  Para enviarte la valoración de tu equipo.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Nombre</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="Tu nombre"
                      className={cn(inputClass, errors.name && "border-red-500/50")}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      WhatsApp / Teléfono
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="Ej: 55 1234 5678"
                      className={cn(inputClass, errors.phone && "border-red-500/50")}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-muted">
                    Correo (opcional)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="tu@correo.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-2 sm:w-auto sm:min-w-[280px]"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Enviando..." : "Solicitar valoración"}
              </Button>
              <p className="text-center text-xs text-muted-dark">
                Al enviar, aceptas que ANTAS revise la información para darte una
                oferta estimada. Sin compromiso de compra.
              </p>
            </div>
          </form>
        </Container>
      </section>
    </div>
  );
}
