export function BrandPanel() {
  return (
    <div
      className="relative hidden lg:flex items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #061325 0%, #0a1929 45%, #0f172a 75%, #1e293b 100%)",
      }}
    >
      {/* Padrao de pontos sutil */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* Halo dourado atras do logo */}
      <div
        aria-hidden
        className="absolute h-[420px] w-[420px] rounded-full blur-3xl opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(249,115,22,0.35) 0%, rgba(212,175,55,0.2) 35%, transparent 70%)",
        }}
      />
      <img
        src="/logo_sentinela.png"
        alt="Sentinela — Sistema de Monitoramento Judicial"
        className="relative w-full max-w-md px-12 drop-shadow-2xl"
      />
    </div>
  );
}
