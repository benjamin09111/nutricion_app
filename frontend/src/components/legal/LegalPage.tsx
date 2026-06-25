import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalPageProps = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export function LegalPage({ title, description, lastUpdated, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600">
            <ArrowLeft className="h-4 w-4" />
            Volver a NutriNet
          </Link>
          <Image
            src="/logo_2.webp"
            alt="NutriNet"
            width={180}
            height={56}
            className="h-auto w-[130px] object-contain sm:w-[160px]"
            priority
          />
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 px-6 py-8 sm:px-10 sm:py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              <ShieldCheck className="h-4 w-4" />
              Documento legal
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              {description}
            </p>
            <p className="mt-4 text-sm font-medium text-slate-500">
              Última actualización: {lastUpdated}
            </p>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
            {sections.map((section, index) => (
              <section key={section.title} className={cn(index > 0 && "pt-1") }>
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-sm leading-7 text-emerald-900">
              Si necesitas una copia o aclaración sobre este documento, escríbenos a <a className="font-semibold underline underline-offset-4" href="mailto:contacto@nutrinet.cl">contacto@nutrinet.cl</a>.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
