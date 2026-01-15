import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import gibIcon from "../assets/gib.jpeg";
import { motion } from "motion/react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

type FeaturedItem = {
  title: string;
  outlet: string;
  date: string;
  summary: string;
  url: string;
  imageUrl?: string;
};

const FEATURED_ITEMS_FALLBACK: FeaturedItem[] = [
  {
    title:
      "Sunday surprise: Churches in Ottawa seeing slight increase in Gen Z worshippers",
    outlet: "Capital Current",
    date: "2025",
    summary:
      "A feature exploring faith, community, and why some Gen Z Ottawans are returning to church.",
    url: "https://capitalcurrent.ca",
  },
  {
    title: "Geoff Cass brings music to the neighbourhood with Red Bird Live",
    outlet: "Capital Current",
    date: "2025",
    summary:
      "A profile of Red Bird Live and how local music spaces bring communities together.",
    url: "https://capitalcurrent.ca",
  },
  {
    title: "And They Were Roommates",
    outlet: "CKCU FM 93.1",
    date: "2025",
    summary:
      "Co-hosted radio show covering music, campus life, and pop culture, airing on CKCU FM 93.1.",
    url: "https://cod.ckcufm.com",
  },
  {
    title: "Gibson’s Groove, Morrison’s Mood",
    outlet: "CKCU FM 93.1",
    date: "2025",
    summary:
      "A radio project featuring underground folk and indie tunes, focused on mood and storytelling.",
    url: "https://cod.ckcufm.com",
  },
];

type ContentItem = {
  id: string;
  title: string;
  outlet: string;
  type: string;
  section: string;
  date: string;
  url: string;
  description?: string;
  imageUrl?: string;
  showOnSite: boolean;
  highlightFeatured: boolean;
};

function useContentSections() {
  const [featured, setFeatured] = useState<ContentItem[]>([]);
  const [selectedWork, setSelectedWork] = useState<ContentItem[]>([]);
  const [archive, setArchive] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "contentItems"), orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const all: ContentItem[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data() as Omit<ContentItem, "id">;
          return { id: docSnap.id, ...d };
        });

        const visible = all.filter((item) => item.showOnSite);

        setFeatured(visible.filter((i) => i.section === "Featured"));
        setSelectedWork(visible.filter((i) => i.section === "Selected Work"));
        setArchive(visible.filter((i) => i.section === "Archive"));
        setLoading(false);
      },
      (error) => {
        console.error("Error loading contentItems:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { featured, selectedWork, archive, loading };
}

/**
 * Used to disable expensive animations + filters on mobile.
 */
function useIsCoarsePointer() {
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarse(m.matches);
    update();
    m.addEventListener?.("change", update);
    return () => m.removeEventListener?.("change", update);
  }, []);

  return isCoarse;
}

function GradientBackground() {
  const isCoarse = useIsCoarsePointer();

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage: `
          radial-gradient(1200px 800px at 50% 20%, rgba(255, 60, 160, 0.75), transparent 75%),
          radial-gradient(1000px 700px at 30% 65%, rgba(244, 114, 182, 0.55), transparent 78%),
          radial-gradient(1100px 750px at 70% 60%, rgba(129, 140, 248, 0.35), transparent 80%),
          radial-gradient(900px 650px at 15% 30%, rgba(45, 212, 191, 0.18), transparent 80%),
          linear-gradient(to bottom, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 1) 100%)
        `,
        backgroundSize: "220% 220%",
        backgroundRepeat: "no-repeat",
        filter: isCoarse ? "none" : "blur(8px)",
      }}
      initial={{ opacity: 0, backgroundPosition: "50% 40%" }}
      animate={
        isCoarse
          ? { opacity: 1, backgroundPosition: "50% 40%" }
          : {
              opacity: 1,
              backgroundPosition: [
                "50% 40%",
                "55% 35%",
                "60% 55%",
                "45% 65%",
                "40% 45%",
                "50% 40%",
                "52% 30%",
                "50% 40%",
              ],
            }
      }
      transition={{
        opacity: { duration: 1.0, ease: "easeOut" },
        backgroundPosition: isCoarse
          ? undefined
          : {
              duration: 30,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            },
      }}
    />
  );
}

export default function HomePage() {
  const { featured, archive } = useContentSections();

  const featuredItems: FeaturedItem[] =
    featured.length > 0
      ? featured.map((item) => ({
          title: item.title,
          outlet: item.outlet,
          date: item.date,
          summary: item.description ?? "",
          url: item.url,
          imageUrl: item.imageUrl ?? "",
        }))
      : FEATURED_ITEMS_FALLBACK;

  const archiveItems: FeaturedItem[] =
    archive.length > 0
      ? archive.map((item) => ({
          title: item.title,
          outlet: item.outlet,
          date: item.date,
          summary: item.description ?? "",
          url: item.url,
          imageUrl: item.imageUrl ?? "",
        }))
      : FEATURED_ITEMS_FALLBACK;

  return (
    <main className="font-sans relative min-h-screen bg-[#0f172a] text-[#f8fafc]">
      <GradientBackground />
      <Header />
      {/* Hero + Featured */}
      <section className="relative overflow-hidden">
        <div className="relative z-10">
          <Hero />
          <FeaturedCarousel items={featuredItems} />
        </div>
      </section>
      {/* CKCU radio */}
      <CKCU />
      {/* Archive + Contact + Footer */}
      <section className="relative overflow-hidden">
        {/* static gradient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `
              radial-gradient(1200px 800px at 50% 10%, rgba(255, 60, 160, 0.75), transparent 75%),
              radial-gradient(900px 650px at 20% 55%, rgba(244, 114, 182, 0.45), transparent 78%),
              radial-gradient(1000px 700px at 80% 65%, rgba(129, 140, 248, 0.32), transparent 80%),
              radial-gradient(950px 600px at 10% 85%, rgba(45, 212, 191, 0.18), transparent 82%),
              radial-gradient(1400px 900px at -10% 45%, rgba(255, 40, 150, 0.82), transparent 85%),
              linear-gradient(to bottom, #0f172a 0%, #1e1b2e 100%)
            `,
            backgroundSize: "220% 200%",
            backgroundRepeat: "no-repeat",
            // ✅ cheaper on mobile
            filter: "blur(8px)",
            opacity: 0.95,
          }}
        />

        {/* actual content sits above the gradient */}
        <div className="relative z-10">
          <Archive items={archiveItems} />
          <Contact />
          <Footer />
        </div>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header
      className="
        sticky top-0 z-50
        backdrop-blur-md sm:backdrop-blur-xl
        bg-transparent
        supports-[backdrop-filter]:bg-[rgba(233,213,255,0.07)]
        shadow-[0_0_35px_rgba(233,213,255,0.15)]
      "
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-center">
        <div className="inline-flex items-center gap-3">
          {[
            { href: "#hero", label: "Home" },
            { href: "#featured", label: "Work" },
            { href: "#radio", label: "Radio" },
            { href: "#archive", label: "Archive" },
            { href: "#contact", label: "Contact" },
          ].map((item) => (
            <div
              key={item.href}
              className="
                px-3 py-1 rounded-full 
                bg-[#020617] border border-white/10 
                shadow-[0_0_18px_rgba(15,23,42,0.7)]
                transition-all duration-200
                hover:bg-[#020617]/90
                hover:scale-[1.06]
                hover:shadow-[0_0_22px_rgba(233,213,255,0.35)]
                cursor-pointer
              "
            >
              <a
                href={item.href}
                className="text-[#f8fafc] hover:text-[#e9d5ff] transition-colors"
              >
                {item.label}
              </a>
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden scroll-mt-24">
      <div className="pt-6 sm:pt-8 md:pt-10" />

      <motion.section
        initial={{ opacity: 0, y: -25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.5, once: true }} // ✅ reduce re-animating on scroll
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="pb-10 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-xl mx-auto flex flex-col items-center text-center gap-3">
          {/* portrait + glow */}
          <div className="relative inline-flex items-center justify-center">
            <div className="pointer-events-none absolute inset-0 w-[calc(100%+40px)] h-[calc(100%+40px)] bg-white opacity-20 blur-3xl rounded-full -z-10" />
            <img
              src={gibIcon}
              alt="Portrait of Lauren Gibson"
              className="
                w-24 h-24
                sm:w-32 sm:h-32
                md:w-40 md:h-40
                lg:w-48 lg:h-48
                rounded-full object-cover
                shadow-xl
                border border-white/10
              "
            />
          </div>

          {/* Text block */}
          <div className="space-y-1 mt-3">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#f8fafc]">
              Lauren Gibson
            </h1>
            <p className="font-sans text-sm sm:text-base md:text-lg text-[#e9d5ff] opacity-95">
              Journalist & Media Creator
            </p>
            <p className="font-sans text-xs sm:text-sm text-[#e9d5ff] opacity-85">
              Capital Current · CKCU FM 93.1 · Toronto & Ottawa
            </p>
          </div>

          <div className="h-px w-12 bg-white/15 my-2" />

          {/* About copy */}
          <div className="font-sans max-w-lg text-sm sm:text-base text-[#f8fafc] leading-relaxed opacity-90">
            <p>
              Third-year Journalism student at Carleton University focused on
              narrative reporting, campus culture, and community storytelling.
            </p>
            <p className="mt-1">
              Experience in digital journalism, broadcast media, and on-air
              hosting through CKCU campus radio and local publications.
            </p>
            <p className="mt-1">
              Open to internships, freelance assignments, and media
              collaborations.
            </p>
          </div>
        </div>
      </motion.section>
    </section>
  );
}

/* ---------------- Featured (Embla autoplay carousel) ---------------- */

function FeaturedCarousel({ items }: { items: FeaturedItem[] }) {
  const isCoarse = useIsCoarsePointer();

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", skipSnaps: false },
    [Autoplay({ delay: 6000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <motion.section
      id="featured"
      initial={{ opacity: 0, x: -60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ amount: 0.2, once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 pt-6 scroll-mt-24"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#f8fafc]">
            Featured Work
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={scrollPrev}
            className="
              h-9 w-9 flex items-center justify-center rounded-full
              bg-white/10 sm:backdrop-blur border border-white/20
              hover:bg-white/20 transition cursor-pointer
            "
          >
            <ChevronLeftIcon className="h-5 w-5 text-white/80" />
          </button>

          <button
            onClick={scrollNext}
            className="
              h-9 w-9 flex items-center justify-center rounded-full
              bg-white/10 sm:backdrop-blur border border-white/20
              hover:bg-white/20 transition cursor-pointer
            "
          >
            <ChevronRightIcon className="h-5 w-5 text-white/80" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 rounded-3xl opacity-40 blur-lg pointer-events-none" />
        <div className="relative rounded-3xl bg-white/70 border border-gray-200 py-5 sm:py-6">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {items.map((item) => (
                <div
                  key={item.title}
                  className="flex-[0_0_85%] sm:flex-[0_0_60%] md:flex-[0_0_45%] lg:flex-[0_0_33%] px-2 sm:px-3"
                >
                  <motion.article
                    whileHover={isCoarse ? undefined : { y: -4, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
                  >
                    {item.imageUrl && (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        <div className="w-full h-32 sm:h-36 md:h-40 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </a>
                    )}

                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                      <p className="font-sans text-xs sm:text-sm font-medium text-indigo-500 mb-1">
                        {item.outlet} · {item.date}
                      </p>
                      <h3 className="font-display text-lg sm:text-xl font-semibold text-[#0F172A]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm sm:text-base text-gray-700 flex-1">
                        {item.summary}
                      </p>
                    </div>
                  </motion.article>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function CKCU() {
  return (
    <section id="radio" className="relative py-16 sm:py-24 scroll-mt-24">
      {/* Subtle top separator line */}
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 h-px
          bg-gradient-to-r from-transparent via-white/30 to-transparent
          opacity-70 z-20
        "
      />

      {/* existing small top glow */}
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 h-14
          bg-[radial-gradient(
            ellipse_120%_160%_at_50%_0%,
            rgba(233,213,255,0.25),
            rgba(255,255,255,0.15),
            transparent 75%
          )]
          blur-3xl opacity-80 z-10
        "
      />

      {/* background image + dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${"https://www.ckcufm.com/codinc/icons/playlisticon-zul0X2mq.jpeg"})`,
        }}
      />
      <div className="absolute inset-0 bg-black/55" />

      {/* content */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3, once: true }} // ✅ reduce re-animating on scroll
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="font-sans inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs sm:text-sm mb-4 sm:backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>On Air · CKCU FM 93.1</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight">
            Radio that mixes{" "}
            <span className="font-bold">music, mood, and campus life.</span>
          </h2>

          <p className="font-sans mt-3 text-sm sm:text-base md:text-lg text-gray-100/90 max-w-2xl">
            From live campus radio to curated music projects, I co-host and
            produce shows that blend storytelling, interviews, and playlists —
            highlighting the voices and sounds of Ottawa&apos;s community.
          </p>

          <div className="font-sans mt-6 grid gap-4 sm:grid-cols-2">
            <div className="bg-black/35 border border-white/10 rounded-2xl p-4 sm:p-5">
              <h3 className="text-lg sm:text-xl font-semibold">
                And They Were Roommates
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-100/90">
                Weekly show covering friendship, campus stories, and the music
                that scores student life. Co-hosted discussions, segment
                planning, and on-air interviews.
              </p>
              <a
                href="https://cod.ckcufm.com/programs/662/info.html"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm sm:text-base font-medium text-emerald-300 hover:underline"
              >
                Listen to the show →
              </a>
            </div>

            <div className="bg-black/35 border border-white/10 rounded-2xl p-4 sm:p-5">
              <h3 className="text-lg sm:text-xl font-semibold">
                Gibson’s Groove, Morrison’s Mood
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-100/90">
                A radio project featuring underground folk and indie tunes,
                focused on mood, storytelling, and the rhythm of student life.
              </p>
              <a
                href="https://cod.ckcufm.com/programs/662/index.html?filter=all"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm sm:text-base font-medium text-emerald-300 hover:underline"
              >
                Explore episodes →
              </a>
            </div>
          </div>

          <div className="font-sans mt-5 flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
              Live hosting & on-air presence
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
              Show planning & segment writing
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
              Music curation & storytelling
            </span>
          </div>
        </motion.div>
      </div>

      {/* existing bottom glow */}
      <div
        className="
          pointer-events-none absolute inset-x-0 bottom-0 h-14
          bg-[radial-gradient(
            ellipse_120%_160%_at_50%_100%,
            rgba(233,213,255,0.25),
            rgba(255,255,255,0.15),
            transparent 75%
          )]
          blur-3xl opacity-80 z-10
        "
      />

      {/* Subtle bottom separator line */}
      <div
        className="
          pointer-events-none absolute inset-x-0 bottom-0 h-px
          bg-gradient-to-r from-transparent via-white/30 to-transparent
          opacity-70 z-20
        "
      />
    </section>
  );
}

/* ---------------- Archive / Contact / Footer ---------------- */

function Archive({ items }: { items: FeaturedItem[] }) {
  const isCoarse = useIsCoarsePointer();

  return (
    <motion.section
      id="archive"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.2, once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-12 sm:pb-10 scroll-mt-24"
    >
      <div className="mb-4 sm:mb-6">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#f8fafc]">
          Archive
        </h2>
      </div>

      {/* 1 col on mobile, 2 on small, 3 on large */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {items.map((item) => (
          <motion.article
            key={item.title}
            className="relative h-full group sm:[perspective:1200px]"
            whileHover={
              isCoarse
                ? undefined
                : { y: -10, rotateX: 3, rotateY: -3, scale: 1.02 }
            }
            transition={{ type: "spring", stiffness: 240, damping: 16 }}
          >
            {/* Glow aura behind card */}
            <div
              className="
                absolute -inset-1 rounded-3xl opacity-25 blur-md pointer-events-none
                bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200
                transition-all duration-300
                sm:group-hover:opacity-60 sm:group-hover:blur-lg
              "
            />

            {/* Card */}
            <div
              className="
                relative overflow-hidden rounded-2xl border border-white/15
                bg-white/80 shadow-sm flex flex-col h-full
                min-h-[420px] sm:min-h-[460px] lg:min-h-[500px]
                transition-all duration-300
                sm:group-hover:shadow-[0_20px_70px_rgba(15,23,42,0.25)]
                [transform-style:preserve-3d]
              "
            >
              {/* Shimmer sweep (desktop only) */}
              <div
                className="
                  pointer-events-none absolute inset-0 opacity-0
                  bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.45),transparent)]
                  translate-x-[-120%]
                  sm:group-hover:opacity-100 sm:group-hover:translate-x-[120%]
                  transition-all duration-700
                "
              />

              {/* Image flush top */}
              {item.imageUrl ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <div className="overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      className="
                        w-full
                        h-40 sm:h-48 md:h-56
                        object-cover
                        transition-transform duration-700 ease-out
                        sm:group-hover:scale-[1.12]
                      "
                    />
                  </div>
                </a>
              ) : (
                <div className="w-full h-28 sm:h-32 md:h-36 bg-slate-100/70" />
              )}

              <div className="h-px bg-black/5" />

              {/* Content */}
              <div className="p-4 sm:p-5 flex flex-col flex-1">
                <h3
                  className="
                    font-display text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2
                    transition-colors duration-300
                    sm:group-hover:text-indigo-700
                  "
                >
                  {item.title}
                </h3>

                <div className="flex-1" />

                <p className="font-sans text-xs sm:text-sm text-gray-500 mt-1">
                  {item.date}
                </p>
              </div>
            </div>
          </motion.article>
        ))}

        {items.length === 0 && (
          <p className="text-sm text-gray-500">No archived pieces yet.</p>
        )}
      </div>
    </motion.section>
  );
}

function Contact() {
  return (
    <motion.section
      id="contact"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3, once: true }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-12 sm:pb-20 scroll-mt-24"
    >
      <div className="font-sans max-w-xl mx-auto bg-white/90 rounded-2xl shadow-[0_18px_60px_rgba(15,23,42,0.08)] border border-gray-200 text-center px-6 sm:px-8 py-8">
        <h2 className="font-display text-gray-800 text-2xl sm:text-3xl font-bold mb-1">
          Contact Me
        </h2>
        <div className="h-[2px] w-12 bg-indigo-300/80 mx-auto mb-4 rounded-full" />
        <p className="text-base sm:text-lg text-gray-600">
          Available for internships, freelance assignments, and media
          collaborations.
        </p>
        <p className="mt-3 text-base sm:text-lg text-gray-800 font-medium">
          laurengibson0202@gmail.com
        </p>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Based in Toronto &amp; Ottawa
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-5 text-sm sm:text-base">
          <a
            href="https://www.linkedin.com/in/lauren-gibson-46180a20b/?originalSubdomain=ca"
            className="text-indigo-600 font-medium hover:underline text-sm sm:text-base"
          >
            LinkedIn
          </a>
          <a
            href="https://capitalcurrent.ca/author/laurengibson3/"
            className="text-indigo-600 font-medium hover:underline text-sm sm:text-base"
          >
            Capital Current
          </a>
          <a
            href="https://cod.ckcufm.com/programs/662/72169.html"
            className="text-indigo-600 font-medium hover:underline text-sm sm:text-base"
          >
            CKCU FM 93.1
          </a>
        </div>
      </div>
    </motion.section>
  );
}

function Footer() {
  return (
    <footer className="text-center text-[#f8fafc] text-xs sm:text-sm pb-6 mt-6 sm:mt-10 px-4">
      © {new Date().getFullYear()} Lauren Gibson · Portfolio site built with
      React, Vite &amp; Tailwind CSS.
    </footer>
  );
}
