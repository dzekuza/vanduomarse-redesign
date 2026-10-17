import Image from "next/image";

export function AtmosphereStrip() {
  return (
    <section className="relative h-[46vh] min-h-80 w-full overflow-hidden">
      <Image
        src="https://picsum.photos/seed/vanduo-marse-cable-wakeboard-lake/1920/900"
        alt="Raitelis ant vandenlentės, tempiamas kabelio virš ežero"
        fill
        sizes="100vw"
        className="object-cover"
        priority={false}
      />
    </section>
  );
}
