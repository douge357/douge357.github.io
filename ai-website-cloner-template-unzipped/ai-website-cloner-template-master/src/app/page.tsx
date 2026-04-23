import Image from "next/image";

const navigation = [
  { label: "Hey", href: "https://ranli.framer.website/" },
  { label: "Projects", href: "https://ranli.framer.website/Projects", active: true },
  { label: "Work Experience", href: "https://ranli.framer.website/Work-experience" },
  { label: "Contact", href: "https://ranli.framer.website/Contact" },
];

const projectGroups = [
  {
    year: "2025",
    items: [
      {
        title: "Design for Android",
        href: "https://ranli.framer.website/new-projects/design-for-android",
        image: "https://framerusercontent.com/images/Use4oddwH3JUtz1HjZjUCbTbrD4.png?scale-down-to=512&width=1800&height=1350",
      },
      {
        title: "Creative Generation Agent",
        href: "https://ranli.framer.website/new-projects/creative-generation-agent",
        image: "https://framerusercontent.com/images/GyuvSRJBe9N8BFAgKjDpi55JA14.png?scale-down-to=512&width=2560&height=1920",
      },
      {
        title: "Yuzu AI",
        href: "https://ranli.framer.website/new-projects/yuzu-ai",
        image: "https://framerusercontent.com/images/M3PyDif23GOgyHWNCJT67k5Cnr8.jpg?scale-down-to=512&width=2880&height=2160",
      },
      {
        title: "AI Flow",
        href: "https://ranli.framer.website/new-projects/funblocks",
        image: "https://framerusercontent.com/images/i4GdC1d4QsB6FhoupBnYkCZjm4.png?scale-down-to=512&width=1440&height=1080",
      },
    ],
  },
  {
    year: "2024",
    items: [
      {
        title: "Coffee Delivery",
        href: "https://ranli.framer.website/new-projects/coffee-delivery",
        image: "https://framerusercontent.com/images/fvjqTLlDMHkO8d4y76O2m0DpuU.png?scale-down-to=512&width=2880&height=2160",
      },
      {
        title: "WMS",
        href: "https://ranli.framer.website/new-projects/wms",
        image: "https://framerusercontent.com/images/1cB4nkcHmk0svYSiIZsu05vfow.png?scale-down-to=512&width=2880&height=2160",
      },
      {
        title: "Chamber",
        href: "https://ranli.framer.website/new-projects/chamber",
        image: "https://framerusercontent.com/images/1FNlNcViQ1nNVIzsvlTBIarIuM.jpg?scale-down-to=512&width=2800&height=1900",
      },
      {
        title: "山西古建",
        href: "https://ranli.framer.website/new-projects/ancient-architecture",
        image: "https://framerusercontent.com/images/2QHcohyIa85JTWBNkJD7D9Gk1j4.jpg?scale-down-to=512&width=1440&height=1080",
      },
      {
        title: "Voyage AI",
        href: "https://ranli.framer.website/new-projects/voyage-ai",
        image: "https://framerusercontent.com/images/3tn0H92jic2S3Okvx3sRwzN7B1Y.jpg?scale-down-to=512&width=1920&height=1440",
      },
    ],
  },
  {
    year: "2021 - 2023",
    items: [
      {
        title: "UL Design",
        href: "https://uldesign.framer.website/",
        image: "https://framerusercontent.com/images/vTLtP8wCafsfthezMWBoA0ylBxs.jpg?scale-down-to=512&width=4320&height=3240",
      },
      {
        title: "Dashboard Design",
        href: "https://uldesign.framer.website/gallery",
        image: "https://framerusercontent.com/images/gOVgfGAwHrVgpcE0UmK3esCedZE.jpg?scale-down-to=512&width=4320&height=3240",
      },
    ],
  },
  {
    year: "2020",
    items: [
      {
        title: "Sayhomee",
        href: "https://ranli.framer.website/new-projects/sayhomee",
        image: "https://framerusercontent.com/images/q8jchKH7VPYbEOY92E9KUqtX8nA.png?width=1920&height=1080",
      },
      {
        title: "InSpace",
        href: "https://ranli.framer.website/new-projects/inspace",
        image: "https://framerusercontent.com/images/9gYLo1FFVJTsQDQECObH5k.jpg?width=2880&height=2160",
      },
    ],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1232px] flex-col px-5 pb-16 pt-6 sm:px-8 lg:px-10">
        <header className="sticky top-0 z-20 -mx-2 mb-10 rounded-full border border-transparent bg-white/82 px-2 py-2 backdrop-blur-sm">
          <nav className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium tracking-[-0.02em]",
                  item.active
                    ? "bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(81,224,205,0.35)]"
                    : "text-foreground/72 hover:bg-secondary hover:text-foreground",
                ].join(" ")}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </header>

        <section className="mb-12 flex max-w-[720px] flex-col gap-5">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Selected Projects
          </p>
          <h1 className="max-w-[12ch] text-5xl font-medium tracking-[-0.06em] text-foreground sm:text-7xl">
            Hey, I&apos;m Ran Li
          </h1>
          <p className="max-w-[56ch] text-base leading-7 text-muted-foreground sm:text-lg">
            A freelance product designer with a calm, editorial visual system. This first build focuses on the
            Projects page structure: grouped timelines, airy spacing, and image-led cards with soft hover motion.
          </p>
        </section>

        <div className="flex flex-col gap-16">
          {projectGroups.map((group) => (
            <section key={group.year} className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-8">
              <div className="lg:pt-2">
                <h2 className="text-4xl font-medium tracking-[-0.06em] text-foreground sm:text-5xl">{group.year}</h2>
              </div>
              <div className="grid gap-7 sm:grid-cols-2">
                {group.items.map((project, index) => (
                  <a
                    key={project.href}
                    href={project.href}
                    className={[
                      "group relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.06)]",
                      "transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]",
                      group.items.length % 2 === 1 && index === group.items.length - 1 ? "sm:col-span-2" : "",
                    ].join(" ")}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-secondary">
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 560px"
                        className="object-cover transition duration-700 group-hover:scale-[1.03]"
                        unoptimized
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 px-1 pb-1 pt-4">
                      <h3 className="text-2xl font-medium tracking-[-0.04em] text-foreground">{project.title}</h3>
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-foreground/70">
                        View
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
