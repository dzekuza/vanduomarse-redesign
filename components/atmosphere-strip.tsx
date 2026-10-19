import Image from "next/image";

export function AtmosphereStrip() {
  return (
    <section className="relative h-[46vh] min-h-80 w-full overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1663226808058-23c9933bd62f?auto=format&fit=crop&w=2000&q=75"
        alt="Raitelis ant vandenlentės, tempiamas kabelio virš ežero"
        fill
        sizes="100vw"
        className="object-cover"
        priority={false}
      />
    </section>
  );
}
