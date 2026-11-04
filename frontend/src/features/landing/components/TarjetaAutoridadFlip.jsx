import FlipCard from "@/shared/ui/FlipCard";

export default function TarjetaAutoridadFlip({ cargo, nombre, icono: Icono, funcion }) {
  const frente = (
    <div className="relative flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-20 -left-16 size-56 rounded-full bg-teal/30 blur-3xl" aria-hidden="true" />
      <div className="relative flex size-24 items-center justify-center rounded-full bg-white/15 text-white ring-4 ring-white/20">
        <Icono size={40} />
      </div>
      <div className="relative flex flex-col gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-white/70">{cargo}</span>
        <span className="text-2xl font-bold leading-tight text-white">{nombre}</span>
      </div>
      <span className="absolute bottom-5 text-[11px] font-semibold uppercase tracking-widest text-white/60">
        Tocá para girar
      </span>
    </div>
  );

  const dorso = (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-white px-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-xl bg-surface-blue text-teal">
        <Icono size={24} />
      </div>
      <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-teal">{cargo}</span>
      <div className="h-px w-12 bg-teal/40" />
      <p className="text-base leading-relaxed text-navy-soft">{funcion}</p>
      <span className="text-sm font-bold text-navy-soft">{nombre}</span>
    </div>
  );

  return (
    <FlipCard
      front={frente}
      back={dorso}
      width={288}
      height={400}
      radius={24}
      background="linear-gradient(160deg, #1B4F7A 0%, #132A46 100%)"
      shadowColor="#132A46"
      shadowOpacity={0.35}
      ariaLabel={`${cargo}: ${nombre}. Tocar para ver más`}
      className="justify-self-center"
    />
  );
}
