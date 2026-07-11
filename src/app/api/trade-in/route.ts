import { NextRequest, NextResponse } from "next/server";
import { addTradeIn } from "@/lib/trade-in";
import type { CoolingType, TradeInFormData } from "@/types/trade-in";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TradeInFormData;

    const required = [
      body.photo,
      body.processor,
      body.motherboard,
      body.ram,
      body.storage,
      body.gpu,
      body.psu,
      body.coolingType,
      body.coolingDetail,
      body.name,
      body.phone,
    ];

    if (required.some((v) => !v?.trim())) {
      return NextResponse.json(
        { error: "Completa todos los campos obligatorios." },
        { status: 400 },
      );
    }

    const submission = await addTradeIn({
      photo: body.photo,
      specs: {
        processor: body.processor.trim(),
        motherboard: body.motherboard.trim(),
        ram: body.ram.trim(),
        storage: body.storage.trim(),
        gpu: body.gpu.trim(),
        psu: body.psu.trim(),
        coolingType: body.coolingType as CoolingType,
        coolingDetail: body.coolingDetail.trim(),
        extras: body.extras?.trim() || undefined,
      },
      contact: {
        name: body.name.trim(),
        phone: body.phone.trim(),
        email: body.email?.trim() || undefined,
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al enviar la solicitud." },
      { status: 500 },
    );
  }
}
