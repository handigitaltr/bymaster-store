import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Manifesto() {
  return (
    <section className="relative isolate overflow-hidden bg-cocoa-950 text-cream-50" aria-labelledby="manifesto-baslik">
      <Image
        src="/images/editorial/doku-cikolata-akis.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover opacity-55"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-cocoa-950 via-cocoa-950/80 to-cocoa-950/10" />
      <div className="container-page grid min-h-[34rem] items-center py-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow eyebrow-light mb-5">Yaklaşımımız</p>
          <h2 id="manifesto-baslik" className="display-xl text-cream-50">
            Sunum, bir tatlının <span className="italic text-caramel-300">ilk izlenimidir.</span>
          </h2>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-cream-200">
            Akışkan bir sos, çıtır bir süsleme, doğru zamanda eklenen bir dokunuş. ByMaster, profesyonel mutfakların sunum kültürünü
            ürünleri, tarifleri ve rehberleriyle her mutfağa taşımayı amaçlar.
          </p>
          <Link href="/hakkimizda" className="btn btn-lg btn-outline-light group mt-10">
            Hikâyemizi okuyun
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
