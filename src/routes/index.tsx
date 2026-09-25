import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Compass,
  Instagram,
  MapPin,
  Navigation,
  Phone,
  Send,
  Share2,
  Star,
  ExternalLink,
  Mail,
  Quote,
  CheckCircle2,
  Sparkles,
  Search,
  HelpCircle,
  X,
} from "lucide-react";
import { site } from "../lib/site-content";
import { ReservationModal } from "../components/reservation-modal";
import { OrderModal } from "../components/order-modal";
import { DishModal, type FeaturedDish } from "../components/dish-modal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beachwood Cafe | Hollywood Hills, Los Angeles" },
      {
        name: "description",
        content:
          "Good Food. Brighter Days. Breakfast, lunch, dinner, coffee and cocktails at the foot of the Hollywood Hills in Beachwood Canyon.",
      },
      { property: "og:title", content: "Beachwood Cafe | Hollywood Hills" },
      {
        property: "og:description",
        content: "Modern American food, coffee and easy company in Beachwood Canyon.",
      },
      { property: "og:type", content: "restaurant" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const featuredDishes: FeaturedDish[] = [
  {
    name: "Lemon Ricotta Pancakes",
    subtitle: "A house favorite.",
    image: "/images/pancakes.jpg",
    category: "Breakfast",
    price: "$18",
    description:
      "Fluffy made-from-scratch ricotta pancakes layered with housemade Meyer lemon sweet cream, fresh California blueberries and raspberries, finished with real maple syrup.",
    ingredients: [
      "Meyer Lemon Zest",
      "Fresh Ricotta",
      "Organic Blueberries",
      "Sweet Cream",
      "Pure Maple Syrup",
    ],
    tags: ["House Favorite", "Vegetarian"],
  },
  {
    name: "Ricotta Avocado Toast",
    subtitle: "Simple. Fresh. Delicious.",
    image: "/images/avotoast.jpg",
    category: "Breakfast & Brunch",
    price: "$16",
    description:
      "Grilled thick-cut country sourdough bread, whipped artisan ricotta, smashed Haas avocados, chopped farm eggs, everything bagel spice, and organic micro kale.",
    ingredients: [
      "Artisan Sourdough",
      "Whipped Ricotta",
      "Haas Avocado",
      "Soft Boiled Egg",
      "Microgreens",
      "EVOO",
    ],
    tags: ["Best Seller", "Vegetarian"],
  },
  {
    name: "Huevos Rancheros",
    subtitle: "Bold flavors, all day.",
    image: "/images/huevos.jpg",
    category: "Brunch Classics",
    price: "$17",
    description:
      "Crisp organic corn tortillas layered with slow-simmered black beans, two farm-fresh sunny eggs, chunky salsa roja, crumbled cotija queso fresco, sliced avocado, and cilantro.",
    ingredients: [
      "Corn Tortillas",
      "Farm Eggs",
      "House Salsa Roja",
      "Black Beans",
      "Cotija Cheese",
      "Avocado",
    ],
    tags: ["Gluten-Free", "Chef Choice"],
  },
  {
    name: "Beachwood Burger",
    subtitle: "A classic done right.",
    image: "/images/burger.jpg",
    category: "Lunch & Dinner",
    price: "$19",
    description:
      "Char-grilled grass-fed chuck patty, melted aged sharp cheddar, crisp butter lettuce, vine-ripened heirloom tomato, pickles, and house special sauce on a toasted sesame brioche, served with crispy hand-cut fries.",
    ingredients: [
      "Grass-Fed Beef",
      "Sharp Cheddar",
      "Sesame Brioche",
      "Special Sauce",
      "Hand-Cut Fries",
    ],
    tags: ["Signature", "Lunch Favorite"],
  },
  {
    name: "Seasonal Salads",
    subtitle: "Fresh ingredients, vibrant flavors.",
    image: "/images/salad.jpg",
    category: "Bowls & Greens",
    price: "$16",
    description:
      "Crisp organic California market greens, shaved rainbow radishes, golden beets, avocado, toasted pepitas, and edible flowers tossed in our house champagne citrus vinaigrette.",
    ingredients: [
      "Farmers Market Greens",
      "Rainbow Radish",
      "Avocado",
      "Pepita Seeds",
      "Citrus Vinaigrette",
    ],
    tags: ["Vegan", "Gluten-Free"],
  },
  {
    name: "Signature Cocktails",
    subtitle: "Crafted for good times.",
    image: "/images/cocktail.jpg",
    category: "Bar & Drinks",
    price: "$15",
    description:
      "Handcrafted spritzes, palomas, and botanical cocktails made with freshly squeezed citrus, artisanal spirits, organic floral cordials, and herbs grown in California sunshine.",
    ingredients: [
      "Fresh Ruby Grapefruit",
      "Artisanal Aperitif",
      "Prosecco",
      "Citrus Blossom",
      "Fresh Mint",
    ],
    tags: ["Handcrafted", "Full Bar"],
  },
];

function GoogleGIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1 1.49-.07 1.49-.61 1.7-.85.22-.24.22-.44.15-.57-.06-.12-.22-.19-.47-.32" />
    </svg>
  );
}

const googleReviewsUrl =
  "https://www.google.com/maps/place/Beachwood+Cafe+Hollywood/@34.1199814,163.631855,3z/data=!4m10!1m2!2m1!1scafe+in+california!3m6!1s0x80c2bf6d60c0fa41:0x3a057cab053ccfd!8m2!3d34.1199814!4d-118.32127!15sChJjYWZlIGluIGNhbGlmb3JuaWFaFCISY2FmZSBpbiBjYWxpZm9ybmlhkgEKcmVzdGF1cmFudOABAA!16s%2Fg%2F11gzrqcym?entry=ttu&g_ep=EgoyMDI2MDkxNi4wIKXMDSoASAFQAw%3D%3D";

interface CustomerReview {
  id: string;
  author: string;
  role: string;
  avatar: string;
  avatarBg: string;
  stars: number;
  date: string;
  favoriteDish: string;
  category: "brunch" | "dinner" | "vibe";
  quote: string;
  visitType: string;
}

const customerReviews: CustomerReview[] = [
  {
    id: "review-1",
    author: "Elena Rostova",
    role: "Local Guide · 142 reviews",
    avatar: "ER",
    avatarBg: "#1a3b6b",
    stars: 5,
    date: "1 week ago",
    favoriteDish: "Lemon Ricotta Pancakes",
    category: "brunch",
    quote:
      "The Lemon Ricotta Pancakes live up to every bit of hype! Incredibly fluffy, zesty with house Meyer lemon cream, and bursting with fresh berries. Sitting under the canyon sunlight after hiking down from the Hollywood sign trail is heaven on earth. Staff is endlessly kind.",
    visitType: "Weekend Brunch",
  },
  {
    id: "review-2",
    author: "Marcus Thornton",
    role: "Local Resident · 89 reviews",
    avatar: "MT",
    avatarBg: "#b87508",
    stars: 5,
    date: "2 weeks ago",
    favoriteDish: "Beachwood Burger & Truffle Fries",
    category: "dinner",
    quote:
      "Such a magical sanctuary at the base of the Hollywood Hills. Barbara Bestor's geometric design and yellow banquettes give it a gorgeous retro-chic feel. The Beachwood Burger on brioche with the house special sauce is easily top 3 in LA. Friendly, warm neighborhood energy.",
    visitType: "Dinner with Friends",
  },
  {
    id: "review-3",
    author: "Samantha Kelly",
    role: "Verified Google Diner",
    avatar: "SK",
    avatarBg: "#2d5a37",
    stars: 5,
    date: "3 weeks ago",
    favoriteDish: "Ricotta Avocado Toast & Matcha",
    category: "brunch",
    quote:
      "A true neighborhood institution with unbeatable California energy. Sourdough toast with whipped ricotta, Haas avocado, and soft farm egg was divine. The iced ceremonial matcha is whisked to perfection. It feels like stepping into a peaceful oasis far away from city noise.",
    visitType: "Saturday Morning",
  },
  {
    id: "review-4",
    author: "Julian Alvarez",
    role: "Local Guide · 210 reviews",
    avatar: "JA",
    avatarBg: "#5c2b29",
    stars: 5,
    date: "Last month",
    favoriteDish: "Farm Shakshuka & Natural Wine",
    category: "dinner",
    quote:
      "Dinner in the canyon is an unforgettable secret. The Shakshuka with poached farm eggs and grilled crusty bread has incredible spice depth. Paired with a chilled orange wine on the patio as twilight hits the hills — simply unmatched hospitality.",
    visitType: "Canyon Twilight Dinner",
  },
  {
    id: "review-5",
    author: "Chloe Dupont",
    role: "Travel Enthusiast · NYC",
    avatar: "CD",
    avatarBg: "#4a306d",
    stars: 5,
    date: "1 month ago",
    favoriteDish: "Huevos Rancheros & Cold Brew",
    category: "brunch",
    quote:
      "Harry Styles celebrated this place and now I understand why the locals hold it so dear. The Huevos Rancheros are authentic, hearty, and full of fresh cilantro and cotija cheese. Fast service even on busy Sundays. Can't wait to return on every LA trip!",
    visitType: "Solo Breakfast Walk",
  },
  {
    id: "review-6",
    author: "Dr. Arthur & Priya Vance",
    role: "Beachwood Canyon Residents",
    avatar: "AV",
    avatarBg: "#1a3b6b",
    stars: 5,
    date: "Frequent Regulars",
    favoriteDish: "Farmer's Hash & House Chai",
    category: "vibe",
    quote:
      "We've lived up Beachwood Canyon for 8 years, and Beachwood Cafe is our kitchen away from home. Consistent excellence, organic ingredients, and a team that remembers your name and your coffee order. A priceless canyon treasure.",
    visitType: "Regulars · 10+ Visits",
  },
  {
    id: "review-7",
    author: "Liam O'Connor",
    role: "Food & Design Critic",
    avatar: "LO",
    avatarBg: "#b87508",
    stars: 5,
    date: "2 months ago",
    favoriteDish: "Crispy Chicken Sandwich",
    category: "dinner",
    quote:
      "Every single dish feels made with genuine culinary care. The fried chicken sandwich is crisp and juicy with pickled slaw that cuts through beautifully. The setting in the canyon under the trees makes any workday lunch feel like a mini vacation.",
    visitType: "Lunch on Patio",
  },
  {
    id: "review-8",
    author: "Maya Chen",
    role: "Local Guide · 78 reviews",
    avatar: "MC",
    avatarBg: "#2d5a37",
    stars: 5,
    date: "2 months ago",
    favoriteDish: "Cardamom Bun & Oat Cortado",
    category: "vibe",
    quote:
      "The sweetest cafe in Los Angeles. The aesthetic is iconic, bright, and cheerful. Great Wi-Fi for morning writing, excellent specialty coffee, and the friendliest baristas. If you're visiting the Hollywood sign, stopping here is mandatory.",
    visitType: "Coffee & Morning Work",
  },
  {
    id: "review-9",
    author: "Noah & David Miller",
    role: "Verified Google Reviewers",
    avatar: "NM",
    avatarBg: "#1a3b6b",
    stars: 5,
    date: "3 months ago",
    favoriteDish: "Brioche French Toast & Bacon",
    category: "brunch",
    quote:
      "We walked down through the historic stone gates of Hollywoodland and found this place. Warmest welcome ever. The French toast was caramelized on the edges and pillowy in the center. Pure culinary perfection.",
    visitType: "Hollywoodland Walk",
  },
];

interface FaqItem {
  id: number;
  question: string;
  category: "reservations" | "location" | "menu" | "atmosphere";
  categoryLabel: string;
  answer: string;
  actionText?: string;
  actionType?: "reserve" | "order" | "map" | "menu" | "contact";
}

const faqItems: FaqItem[] = [
  {
    id: 1,
    question: "Do I need a reservation, or do you accept walk-ins?",
    category: "reservations",
    categoryLabel: "Reservations & Hours",
    answer:
      "We warmly welcome walk-in guests every single day! Tables across our sunlit dining floor and heated outdoor garden patio are seated on a first-come, first-served basis. For weekend brunch and evening dinner, we recommend booking ahead online or via OpenTable to secure your preferred time with zero wait.",
    actionText: "Reserve a Table Online",
    actionType: "reserve",
  },
  {
    id: 2,
    question: "Where can I park when visiting the cafe in Beachwood Canyon?",
    category: "location",
    categoryLabel: "Location & Parking",
    answer:
      "Free, non-metered street parking is available along North Beachwood Drive and Belden Drive directly in front of and surrounding the cafe. Because we are nestled in the historic residential Hollywoodland village, we kindly request our guests to park considerately, avoid blocking driveways, and enjoy the scenic neighborhood walk.",
    actionText: "Open GPS Navigation",
    actionType: "map",
  },
  {
    id: 3,
    question: "Are dogs welcome on your outdoor patio?",
    category: "atmosphere",
    categoryLabel: "Atmosphere & Events",
    answer:
      "Absolutely! Our lush outdoor garden patio is 100% dog-friendly. We love greeting our neighborhood canine companions and are always happy to provide fresh, chilled water bowls and shady spots under our canyon umbrellas while you dine.",
  },
  {
    id: 4,
    question: "What vegetarian, vegan, and gluten-free options are available?",
    category: "menu",
    categoryLabel: "Menu & Dietary",
    answer:
      "Our farm-to-table seasonal kitchen caters generously to all dietary preferences. We offer abundant vegetarian, vegan, and gluten-free choices clearly designated on our menu—such as our Canyon Grain Bowl, Artisan Avocado Toast, fresh-pressed juices, specialty oat/almond milk coffees, and housemade gluten-free pastries.",
    actionText: "View Full Menu",
    actionType: "menu",
  },
  {
    id: 5,
    question: "How close is the cafe to the Hollywood Sign and hiking trails?",
    category: "location",
    categoryLabel: "Location & Parking",
    answer:
      "Beachwood Cafe sits right at the historic gateway to the Hollywood Sign! The iconic Beachwood Canyon trailhead, the historic Hollywoodland granite arches, and scenic Lake Hollywood trails are just a short walk up the canyon road. Many hikers begin their day with our espresso and brunch before exploring the hills.",
  },
  {
    id: 6,
    question: "What are your daily service hours for breakfast, brunch, and dinner?",
    category: "reservations",
    categoryLabel: "Reservations & Hours",
    answer:
      "We are open 7 days a week starting at 8:00 AM. Breakfast and specialty espresso bar service begin at 8:00 AM daily; our full brunch is served through 4:00 PM; and on Friday through Sunday our kitchen transitions into evening dinner service with seasonal entrees, fine wines, and craft beers until 9:00 PM.",
  },
  {
    id: 7,
    question: "Can I order food online for curbside pickup or home delivery?",
    category: "menu",
    categoryLabel: "Menu & Dietary",
    answer:
      "Yes! You can explore our full seasonal menu online, add dishes to cart, and order takeaway directly. For delivery across Los Angeles and surrounding canyon neighborhoods, we partner with DoorDash.",
    actionText: "Explore Full Menu",
    actionType: "menu",
  },
  {
    id: 8,
    question: "Can you accommodate large group parties, birthdays, or private events?",
    category: "atmosphere",
    categoryLabel: "Atmosphere & Events",
    answer:
      "We love hosting celebrations! Groups of up to 6 can reserve directly online. For large parties of 7+, private patio buyouts, birthdays, baby showers, or film wrap dinners, please contact us directly at +917814485357 or kanuvirdi001@gmail.com for tailored prix-fixe menus and dedicated event coordination.",
    actionText: "Inquire About Events",
    actionType: "contact",
  },
  {
    id: 9,
    question: "Is Beachwood Cafe family-friendly with options for children?",
    category: "menu",
    categoryLabel: "Menu & Dietary",
    answer:
      "Very much so! Families are the true heart of our canyon community. We provide comfortable high chairs, booster seating, and wholesome kid-approved favorites like our brioche French toast with berries, scrambled organic farm eggs, hand-cut potato fries, and fresh fruit bowls.",
  },
  {
    id: 10,
    question: "What is the dress code and atmosphere at the cafe?",
    category: "atmosphere",
    categoryLabel: "Atmosphere & Events",
    answer:
      "Our atmosphere is quintessential California canyon living—effortlessly relaxed, welcoming, and creative. Whether you are in hiking apparel fresh off the canyon trails, casual weekend brunch attire, or evening date-night chic, you will always feel completely at home here.",
  },
];

function Index() {
  const [reviewCategory, setReviewCategory] = useState<"all" | "brunch" | "dinner" | "vibe">("all");
  const [reviewPageIndex, setReviewPageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedDish, setSelectedDish] = useState<FeaturedDish | null>(null);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // FAQ Interactive State
  const [faqCategory, setFaqCategory] = useState<string>("all");
  const [faqSearch, setFaqSearch] = useState<string>("");
  const [openFaqIds, setOpenFaqIds] = useState<number[]>([1, 2]);

  const toggleFaq = (id: number) => {
    setOpenFaqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFaqs = faqItems.filter((item) => {
    const matchesCategory = faqCategory === "all" || item.category === faqCategory;
    const term = faqSearch.trim().toLowerCase();
    const matchesSearch =
      !term ||
      item.question.toLowerCase().includes(term) ||
      item.answer.toLowerCase().includes(term) ||
      item.categoryLabel.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setTimeout(() => setNewsletterSubscribed(false), 4500);
      setNewsletterEmail("");
    }
  };

  const filteredReviews =
    reviewCategory === "all"
      ? customerReviews
      : customerReviews.filter((r) => r.category === reviewCategory);

  const reviewsPerPage = 3;
  const totalReviewPages = Math.max(1, Math.ceil(filteredReviews.length / reviewsPerPage));
  const safePageIndex = Math.min(reviewPageIndex, totalReviewPages - 1);
  const visibleReviews = filteredReviews.slice(
    safePageIndex * reviewsPerPage,
    safePageIndex * reviewsPerPage + reviewsPerPage
  );

  const prevReviewPage = () => {
    setReviewPageIndex((prev) => (prev <= 0 ? totalReviewPages - 1 : prev - 1));
  };

  const nextReviewPage = () => {
    setReviewPageIndex((prev) => (prev >= totalReviewPages - 1 ? 0 : prev + 1));
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !e.changedTouches || !e.changedTouches[0]) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 45) {
      nextReviewPage();
    } else if (diff < -45) {
      prevReviewPage();
    }
    setTouchStartX(null);
  };

  // Autoplay review rotation every 7 seconds, pauses on hover
  useEffect(() => {
    if (!isAutoPlaying || totalReviewPages <= 1) return;
    const interval = setInterval(() => {
      setReviewPageIndex((prev) => (prev >= totalReviewPages - 1 ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, totalReviewPages]);

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative min-h-[90svh] lg:min-h-[94svh] flex flex-col justify-between overflow-hidden bg-[#0d121c] text-white">
        {/* Enhanced Hero Background Image with Crisp High-Resolution Clarity */}
        <img
          src="/images/hero.jpg"
          alt="Beachwood Cafe interior featuring yellow counter, geometric tile floor, and Hollywood hills mural"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.06] saturate-[1.08] [image-rendering:-webkit-optimize-contrast] transition-all duration-700"
        />

        {/* Cinematic Lighting Overlays - Protecting text legibility while keeping the cafe interior crystal-clear */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent md:from-black/65 md:via-black/25 md:to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_18%,rgba(217,146,20,0.12)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d121c]/70 via-[#0d121c]/20 to-transparent pointer-events-none" />

        {/* Top spacer */}
        <div className="relative z-10 pt-12 sm:pt-16" />

        {/* Hero Main Content */}
        <div className="site-container relative z-10 pb-12 sm:pb-16 flex-1 flex flex-col justify-center">
          <div className="max-w-2xl">
            {/* Frosted Glass Badge Overline */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 mb-5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#d99214] animate-pulse" />
              <span className="font-sans text-[0.68rem] sm:text-xs font-bold tracking-[0.24em] uppercase text-white">
                A Modern Cafe in Beachwood Canyon
              </span>
            </div>

            {/* Editorial Headline with 2 Complementary Fonts Pairing */}
            <h1 className="leading-[0.92] tracking-tight text-left">
              {/* Font 1: Playfair Display Bold Roman */}
              <span className="block font-display text-[2.6rem] xs:text-[3.2rem] sm:text-[4.75rem] lg:text-[5.85rem] font-bold text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] tracking-[-0.015em]">
                Good Food,
              </span>
              {/* Font 2: Cormorant Garamond Luxury Italic with Warm Champagne Tone */}
              <span className="block font-serif italic text-[2.9rem] xs:text-[3.6rem] sm:text-[5.35rem] lg:text-[6.5rem] font-normal text-[#f8e5c2] tracking-normal -mt-1 sm:-mt-3 drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                Brighter Days.
              </span>
            </h1>

            {/* Subtitle with High-Contrast Clarity */}
            <div className="mt-6 max-w-lg">
              <p className="font-sans text-base sm:text-lg text-white font-semibold leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                Breakfast. Lunch. Dinner. Coffee. Cocktails.
              </p>
              <p className="mt-1 font-sans text-sm sm:text-base text-white/90 font-normal leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                A neighborhood favorite in the heart of Hollywood.
              </p>
            </div>

            {/* Action Buttons with Elevated Hover States */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
              <Link
                to="/menu"
                className="btn-olive bg-[#d99214] hover:bg-[#c4800b] text-[#191918] font-extrabold px-8 py-3.5 text-xs tracking-wider shadow-xl shadow-[#d99214]/30 rounded-md transition-all hover:scale-105 active:scale-95 text-center w-full sm:w-auto"
              >
                View Menu
              </Link>
              <button
                type="button"
                onClick={() => setReserveModalOpen(true)}
                className="btn-outline-light px-8 py-3.5 text-xs tracking-wider font-bold rounded-md bg-white/10 backdrop-blur-md border border-white/45 text-white hover:bg-white hover:text-[#191918] hover:border-white transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer w-full sm:w-auto text-center"
              >
                Reserve a Table
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Scroll Indicator */}
        <div className="site-container relative z-10 pb-8 flex items-center justify-between border-t border-white/20 pt-4">
          <a
            href="#experience"
            className="group flex items-center gap-2.5 text-[0.68rem] font-bold tracking-[0.22em] uppercase text-white/85 hover:text-[#f8e5c2] transition-colors drop-shadow-sm"
          >
            <span className="w-6 h-6 rounded-full border border-white/40 flex items-center justify-center group-hover:border-[#f8e5c2] group-hover:scale-110 transition-all bg-black/20 backdrop-blur-sm">
              <ArrowDown className="size-3 transition-transform group-hover:translate-y-0.5 text-white group-hover:text-[#f8e5c2]" />
            </span>
            SCROLL TO EXPLORE
          </a>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE BEACHWOOD EXPERIENCE SECTION */}
      {/* ========================================================================= */}
      <section id="experience" className="py-24 lg:py-32 bg-[#ede4d5] relative overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[350px] bg-[#d99214]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="site-container relative z-10">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            {/* Botanical sketch icon */}
            <div className="text-[#d99214] mb-5 anim-float">
              <svg
                width="42"
                height="28"
                viewBox="0 0 36 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 18C10 18 18 10 34 2" />
                <path d="M12 13C10 9 12 6 15 5C17 8 16 11 12 13Z" />
                <path d="M20 9C19 6 22 4 25 4C26 7 24 9 20 9Z" />
                <path d="M25 6C26 3 30 2 32 3C32 6 29 7 25 6Z" />
              </svg>
            </div>

            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1a3b6b]/10 border border-[#d99214]/50 mb-5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#d99214] animate-pulse" />
              <span className="font-sans text-[0.72rem] sm:text-xs font-bold tracking-[0.24em] uppercase text-[#1a3b6b]">
                The Beachwood Experience
              </span>
              <span className="w-2 h-2 rounded-full bg-[#d99214] animate-pulse" />
            </div>

            {/* Editorial Headline with Blue & Yellow Two-Tone Luxury Typography */}
            <h2 className="leading-[1.1] tracking-tight">
              <span className="block font-display text-3xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#1a3b6b]">
                A Modern Café
              </span>
              <span className="block font-serif italic text-3xl sm:text-5xl lg:text-[3.65rem] font-normal text-[#d99214] mt-2 sm:mt-3">
                with a Neighborhood Soul
              </span>
            </h2>

            {/* Elegant Golden Divider Flourish */}
            <div className="my-8 flex items-center justify-center gap-3">
              <span className="h-[1px] w-12 sm:w-20 bg-[#d99214]/40" />
              <span className="w-2 h-2 rotate-45 bg-[#d99214]" />
              <span className="h-[1px] w-12 sm:w-20 bg-[#d99214]/40" />
            </div>

            {/* Main Narrative Text */}
            <div className="max-w-3xl mx-auto px-2">
              <p className="font-serif text-lg sm:text-xl lg:text-[1.38rem] text-[#1a3b6b] leading-[1.8] sm:leading-[1.9] font-normal">
                Nestled beneath the iconic{" "}
                <span className="text-[#b87508] font-bold">Hollywood Sign</span>, Beachwood Cafe serves
                thoughtfully crafted meals from morning to night in a vibrant, airy space. With a modern
                American menu infused with{" "}
                <span className="text-[#b87508] font-bold">
                  Asian, Scandinavian, and Mediterranean
                </span>{" "}
                influences, we offer everything from bold breakfast plates to refined evening entrees, always
                with a touch of <span className="text-[#b87508] font-bold">California charm</span>.
              </p>
            </div>

            {/* Feature Highlights Pills in Signature Blue & Yellow */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#dfd2be] border border-[#d99214]/50 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d99214]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#1a3b6b]">
                  Morning to Night
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#dfd2be] border border-[#d99214]/50 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d99214]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#1a3b6b]">
                  Global Influences
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#dfd2be] border border-[#d99214]/50 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d99214]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#1a3b6b]">
                  California Charm
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/about"
                className="btn-cobalt bg-[#1a3b6b] hover:bg-[#132c52] text-white font-bold px-8 py-3.5 text-xs tracking-[0.16em] uppercase rounded shadow-lg shadow-[#1a3b6b]/20 border border-[#d99214]/40 transition-all hover:scale-105 active:scale-95 group"
              >
                <span>Our Story</span>
                <ArrowRight className="size-3.5 text-[#d99214] transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FEATURED DISHES SECTION */}
      {/* ========================================================================= */}
      <section className="py-24 lg:py-32 bg-[#dfd2be] border-y border-[#c9bba6] relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d99214]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1a3b6b]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="site-container relative z-10">
          {/* Section Heading & Subtitle */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1a3b6b]/10 border border-[#d99214]/50 mb-4 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#d99214] animate-pulse" />
              <span className="font-sans text-[0.72rem] sm:text-xs font-bold tracking-[0.24em] uppercase text-[#1a3b6b]">
                Featured Dishes
              </span>
              <span className="w-2 h-2 rounded-full bg-[#d99214] animate-pulse" />
            </div>

            <h2 className="leading-[1.12] tracking-tight">
              <span className="block font-display text-3xl sm:text-4xl lg:text-[3.1rem] font-bold text-[#191918]">
                From Morning Coffee
              </span>
              <span className="block font-serif italic text-3xl sm:text-4xl lg:text-[3.25rem] font-normal text-[#b87508] mt-1 sm:mt-2">
                to Evening Cheers
              </span>
            </h2>

            <p className="mt-4 text-sm sm:text-base lg:text-[1.05rem] text-[#524c43] leading-relaxed max-w-2xl mx-auto font-sans">
              Our menus evolve with the day, offering hearty breakfasts, fresh lunches, and indulgent dinners, each crafted to satisfy every craving from morning to night.
            </p>
          </div>

          {/* Luxury Dishes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {featuredDishes.map((dish) => (
              <div
                key={dish.name}
                onClick={() => setSelectedDish(dish)}
                className="group relative bg-[#ede4d5] rounded-2xl overflow-hidden border border-[#c9bba6]/80 shadow-sm hover:shadow-2xl hover:shadow-[#1a3b6b]/15 hover:-translate-y-2.5 active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col will-change-transform touch-feedback"
              >
                {/* Photo Showcase Container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#d2c4b0]">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-[0.5deg]"
                    loading="lazy"
                  />

                  {/* Gradient Overlay for Mood & Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

                  {/* Top Floating Badges */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#1a3b6b]/90 backdrop-blur-md text-[0.66rem] font-bold uppercase tracking-wider text-[#f8e5c2] shadow-md border border-white/20">
                      {dish.category}
                    </span>
                  </div>

                  <div className="absolute top-3.5 right-3.5">
                    <span className="px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-extrabold text-[#1a3b6b] shadow-md border border-[#d99214]/40">
                      {dish.price}
                    </span>
                  </div>

                  {/* Interactive Quick View Floating Bar - Touch friendly on mobile, hover-revealed on desktop */}
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 flex items-center justify-between bg-black/75 sm:bg-black/60 backdrop-blur-md text-white opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-full sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition-all duration-300 ease-out">
                    <span className="text-[0.72rem] sm:text-xs font-semibold tracking-wider text-[#f8e5c2] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d99214] animate-pulse" />
                      Tap for Recipe & Details
                    </span>
                    <span className="text-[0.72rem] sm:text-xs font-bold text-white flex items-center gap-1">
                      Details <ArrowRight className="size-3 text-[#d99214] transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>

                {/* Card Information */}
                <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between bg-[#ede4d5]/90">
                  <div>
                    {/* Dish Title */}
                    <h3 className="font-display text-xl sm:text-[1.35rem] font-bold text-[#191918] group-hover:text-[#1a3b6b] transition-colors duration-300 leading-snug">
                      {dish.name}
                    </h3>

                    {/* Subtitle */}
                    <p className="font-serif italic text-base text-[#b87508] mt-1 font-normal">
                      {dish.subtitle}
                    </p>

                    {/* Brief Narrative Description */}
                    <p className="mt-2.5 text-xs sm:text-[0.82rem] text-[#555047] leading-relaxed line-clamp-2">
                      {dish.description}
                    </p>
                  </div>

                  {/* Dietary Tags & Card Footer */}
                  <div className="mt-4 pt-3.5 border-t border-[#c9bba6]/50 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {dish.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full bg-[#dfd2be] text-[0.66rem] font-semibold text-[#1a3b6b] border border-[#c9bba6]/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[#1a3b6b] group-hover:text-[#b87508] transition-colors shrink-0 ml-2 flex items-center gap-1">
                      Quick View <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Explore Full Menu CTA */}
          <div className="mt-14 text-center">
            <Link
              to="/menu"
              className="btn-cobalt bg-[#1a3b6b] hover:bg-[#122a4f] text-white font-bold px-9 py-3.5 text-xs tracking-[0.16em] uppercase rounded shadow-lg shadow-[#1a3b6b]/20 border border-[#d99214]/40 transition-all hover:scale-105 active:scale-95 group inline-flex items-center gap-2"
            >
              <span>Explore the Full Menu</span>
              <ArrowRight className="size-3.5 text-[#d99214] transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. VERIFIED CUSTOMER REVIEWS & COMMUNITY LOVE */}
      {/* ========================================================================= */}
      <section
        className="py-20 lg:py-28 bg-[#ede4d5] relative overflow-hidden"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Decorative soft ambient glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#d99214]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#1a3b6b]/10 blur-3xl pointer-events-none" />

        <div className="site-container relative z-10">
          {/* Header Title & Eyebrow */}
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#c9bba6] shadow-xs text-[0.72rem] font-extrabold uppercase tracking-widest text-[#1a3b6b]">
              <Sparkles className="size-3.5 text-[#d99214]" />
              <span>Verified Guest Experiences</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#191918] leading-tight">
              Beloved by Locals & Canyon Explorers
            </h2>

            <p className="text-sm sm:text-base text-[#555047] font-medium leading-relaxed max-w-2xl mx-auto">
              From morning espresso after hiking the Hollywood sign trail to unhurried sunset dinners, here is what guests cherish most about our canyon sanctuary.
            </p>
          </div>

          {/* Google Score & Highlights Banner */}
          <div className="bg-[#dfd2be]/70 border border-[#c9bba6] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-10 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
              <div className="size-16 rounded-2xl bg-white shadow-md flex items-center justify-center border border-[#c9bba6]/50 shrink-0">
                <GoogleGIcon className="size-8" />
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  <span className="font-display text-4xl sm:text-5xl font-bold text-[#191918]">4.6</span>
                  <div className="flex flex-col items-start text-left">
                    <div className="flex items-center gap-1 text-[#d99214]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="size-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-extrabold text-[#191918] mt-0.5">
                      1,600+ Google Reviews
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#555047] mt-1 font-medium">
                  Official Google rating for Beachwood Cafe · Hollywood Hills, CA
                </p>
              </div>

              {/* Badges on desktop */}
              <div className="hidden xl:flex items-center gap-5 text-xs font-bold text-[#1a3b6b] border-l border-[#c9bba6] pl-6 ml-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>100% Scratch Kitchen</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-4 text-[#d99214] shrink-0" />
                  <span>Barbara Bestor Design</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-cobalt bg-[#1a3b6b] hover:bg-[#122a4f] text-white font-bold px-5 py-2.5 sm:py-3 text-xs uppercase tracking-wider rounded-full shadow-md shadow-[#1a3b6b]/20 inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <span>Read Google Reviews</span>
                <ExternalLink className="size-3.5" />
              </a>
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 sm:py-3 rounded-full bg-white/90 hover:bg-white text-[#191918] font-bold text-xs uppercase tracking-wider border border-[#c9bba6] shadow-xs inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Star className="size-3.5 fill-[#d99214] text-[#d99214]" />
                <span>Write a Review</span>
              </a>
            </div>
          </div>

          {/* Category Filter Tabs with smooth mobile horizontal scroll */}
          <div className="flex items-center sm:justify-center gap-2 sm:gap-3 mb-8 overflow-x-auto no-scrollbar pb-2 sm:pb-0 touch-pan-x -mx-2 px-2 sm:mx-0 sm:px-0 w-full max-w-full">
            {[
              { key: "all", label: "All Stories", count: customerReviews.length },
              {
                key: "brunch",
                label: "Brunch & Pancakes",
                count: customerReviews.filter((r) => r.category === "brunch").length,
              },
              {
                key: "dinner",
                label: "Dinner & Kitchen",
                count: customerReviews.filter((r) => r.category === "dinner").length,
              },
              {
                key: "vibe",
                label: "Canyon Vibe & Coffee",
                count: customerReviews.filter((r) => r.category === "vibe").length,
              },
            ].map((tab) => {
              const active = reviewCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setReviewCategory(tab.key as any);
                    setReviewPageIndex(0);
                  }}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 shrink-0 ${
                    active
                      ? "bg-[#1a3b6b] text-white shadow-md shadow-[#1a3b6b]/20 scale-105"
                      : "bg-white/80 hover:bg-white text-[#555047] hover:text-[#191918] border border-[#c9bba6]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[0.68rem] px-1.5 py-0.5 rounded-full font-extrabold ${
                      active ? "bg-[#d99214] text-[#191918]" : "bg-[#ede4d5] text-[#555047]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cards Grid with Staggered Hover Animations and Touch Swipe */}
          <div
            key={safePageIndex}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch animate-in fade-in slide-in-from-right-4 duration-300 touch-pan-y"
          >
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                className="group relative rounded-2xl bg-white border border-[#dfd2be] p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-2xl hover:border-[#d99214] hover:-translate-y-2 active:scale-[0.99] transition-all duration-300 min-h-[380px] touch-feedback"
              >
                {/* Subtle Amber Glow Accent on Hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#d99214]/6 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Top Section */}
                <div className="relative z-10">
                  {/* Author Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: review.avatarBg }}
                        className="size-11 sm:size-12 rounded-full text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0 ring-2 ring-transparent group-hover:ring-[#d99214]/50 transition-all duration-300"
                      >
                        {review.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#191918] text-sm sm:text-base leading-snug group-hover:text-[#1a3b6b] transition-colors">
                          {review.author}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-[#767064] mt-0.5">
                          <GoogleGIcon className="size-3.5" />
                          <span className="font-semibold">{review.role}</span>
                        </div>
                      </div>
                    </div>

                    <Quote className="size-7 text-[#d99214]/25 group-hover:text-[#d99214]/60 group-hover:scale-110 transition-all duration-300 shrink-0" />
                  </div>

                  {/* Rating Stars & Timestamp */}
                  <div className="flex items-center justify-between gap-2 mb-3.5 pt-2 border-t border-[#f0eae0]">
                    <div className="flex items-center gap-1 text-[#d99214]">
                      {[...Array(review.stars)].map((_, i) => (
                        <Star
                          key={i}
                          className="size-4 fill-current transition-transform duration-200 group-hover:scale-110"
                        />
                      ))}
                    </div>
                    <span className="text-[0.72rem] font-semibold text-[#767064]">
                      {review.date}
                    </span>
                  </div>

                  {/* Favorite Dish Highlight */}
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ede4d5] group-hover:bg-[#1a3b6b] text-[#1a3b6b] group-hover:text-white text-xs font-bold transition-colors duration-300">
                      <Sparkles className="size-3 text-[#d99214]" />
                      <span>{review.favoriteDish}</span>
                    </span>
                  </div>

                  {/* Quote */}
                  <blockquote className="text-sm text-[#2e2a25] leading-relaxed font-normal italic">
                    “{review.quote}”
                  </blockquote>
                </div>

                {/* Bottom Card Footer */}
                <div className="relative z-10 mt-6 pt-4 border-t border-[#f0eae0] flex items-center justify-between text-[0.72rem]">
                  <span className="font-bold text-[#1a3b6b] bg-[#1a3b6b]/10 px-2.5 py-1 rounded-full">
                    {review.visitType}
                  </span>
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>Verified Diner</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination & Controls */}
          {totalReviewPages > 1 && (
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#c9bba6]/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#555047]">
                <span>Showing Page</span>
                <span className="font-extrabold text-[#191918]">{safePageIndex + 1}</span>
                <span>of</span>
                <span className="font-extrabold text-[#191918]">{totalReviewPages}</span>
                <span className="text-[#767064] hidden sm:inline">
                  · {filteredReviews.length} authentic reviews in this category
                </span>
              </div>

              {/* Navigation Arrows & Dot Indicators */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={prevReviewPage}
                  aria-label="Previous reviews page"
                  className="size-10 rounded-full bg-white hover:bg-[#1a3b6b] text-[#191918] hover:text-white border border-[#c9bba6] shadow-sm flex items-center justify-center transition-all duration-200 cursor-pointer"
                >
                  <ChevronLeft className="size-5" />
                </button>

                <div className="flex items-center gap-1.5 px-2">
                  {[...Array(totalReviewPages)].map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReviewPageIndex(idx)}
                      aria-label={`Go to reviews page ${idx + 1}`}
                      className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        safePageIndex === idx
                          ? "w-8 bg-[#d99214]"
                          : "w-2.5 bg-[#c9bba6] hover:bg-[#191918]"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={nextReviewPage}
                  aria-label="Next reviews page"
                  className="size-10 rounded-full bg-white hover:bg-[#1a3b6b] text-[#191918] hover:text-white border border-[#c9bba6] shadow-sm flex items-center justify-center transition-all duration-200 cursor-pointer"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5.5 FREQUENTLY ASKED QUESTIONS (FAQ) SECTION */}
      {/* ========================================================================= */}
      <section
        id="faq"
        className="relative py-20 sm:py-28 bg-[#090e17] text-white overflow-hidden border-t border-white/10"
      >
        {/* Ambient Subtle Glow Orbs */}
        <div
          className="absolute top-0 right-1/4 size-96 rounded-full bg-[#d99214]/10 blur-[130px] pointer-events-none animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div className="absolute bottom-0 left-1/4 size-96 rounded-full bg-[#1a3b6b]/25 blur-[150px] pointer-events-none" />

        <div className="site-container relative z-10 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md shadow-sm">
              <HelpCircle className="size-3.5 text-[#e5a924]" />
              <span className="text-[0.62rem] sm:text-[0.68rem] font-bold tracking-[0.2em] uppercase text-[#e5a924]">
                GUEST GUIDE & FREQUENTLY ASKED QUESTIONS
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Curious About{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5a924] via-[#fcd874] to-[#e5a924] italic font-serif">
                Beachwood?
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-[#ede4d5]/80 font-light leading-relaxed max-w-2xl mx-auto">
              Everything you need to know about our tables, canyon parking, dog-friendly patio, seasonal farm-to-table menu, and Hollywoodland village life.
            </p>
          </div>

          {/* Search Bar & Category Filter Bar */}
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Live Search Input */}
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Search className="size-4" />
              </div>
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search questions (e.g. dogs, parking, vegan, hours...)"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#e5a924] focus:ring-1 focus:ring-[#e5a924] backdrop-blur-md transition-all shadow-inner"
              />
              {faqSearch && (
                <button
                  type="button"
                  onClick={() => setFaqSearch("")}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills with smooth mobile touch swipe */}
            <div className="flex items-center sm:justify-center gap-2 pt-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x -mx-2 px-2 sm:mx-0 sm:px-0 w-full max-w-full">
              {[
                { id: "all", label: "All Questions", count: faqItems.length },
                {
                  id: "reservations",
                  label: "Reservations & Hours",
                  count: faqItems.filter((f) => f.category === "reservations").length,
                },
                {
                  id: "location",
                  label: "Location & Parking",
                  count: faqItems.filter((f) => f.category === "location").length,
                },
                {
                  id: "menu",
                  label: "Menu & Dietary",
                  count: faqItems.filter((f) => f.category === "menu").length,
                },
                {
                  id: "atmosphere",
                  label: "Atmosphere & Events",
                  count: faqItems.filter((f) => f.category === "atmosphere").length,
                },
              ].map((cat) => {
                const isActive = faqCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFaqCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? "bg-[#e5a924] text-[#191918] font-bold shadow-md shadow-[#e5a924]/25 scale-105"
                        : "bg-white/[0.06] hover:bg-white/[0.12] text-[#ede4d5]/80 hover:text-white border border-white/15"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[0.62rem] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? "bg-black/20 text-[#191918]" : "bg-white/10 text-[#ede4d5]/60"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FAQ Accordion Grid: 2-Column Responsive Layout */}
          <div className="max-w-5xl mx-auto">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <HelpCircle className="size-8 text-[#e5a924]/60 mx-auto" />
                <h4 className="text-base font-bold text-white">No matching questions found</h4>
                <p className="text-xs text-[#ede4d5]/70 max-w-md mx-auto">
                  We couldn't find any questions matching "{faqSearch}". Please clear your search or reach out directly to our concierge below.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFaqSearch("");
                    setFaqCategory("all");
                  }}
                  className="px-4 py-2 rounded-lg bg-[#e5a924] text-[#191918] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Reset Search & Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaqIds.includes(faq.id);
                  const formattedIndex = String(faq.id).padStart(2, "0");
                  return (
                    <div
                      key={faq.id}
                      className={`rounded-2xl transition-all duration-300 border backdrop-blur-xl overflow-hidden ${
                        isOpen
                          ? "bg-gradient-to-br from-[#161f2e]/90 to-[#0e1420]/95 border-[#e5a924]/40 shadow-xl shadow-[#e5a924]/5"
                          : "bg-white/[0.04] hover:bg-white/[0.07] border-white/10 hover:border-white/20 shadow-md"
                      }`}
                    >
                      {/* Accordion Question Trigger Button */}
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full text-left p-5 flex items-start justify-between gap-4 cursor-pointer select-none group"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`font-mono text-[0.68rem] font-bold px-2 py-0.5 rounded border mt-0.5 shrink-0 transition-colors ${
                              isOpen
                                ? "bg-[#e5a924]/20 border-[#e5a924]/50 text-[#e5a924]"
                                : "bg-white/10 border-white/15 text-[#ede4d5]/60 group-hover:text-white"
                            }`}
                          >
                            {formattedIndex}
                          </span>
                          <div>
                            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#e5a924] block mb-1">
                              {faq.categoryLabel}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug group-hover:text-[#fcd874] transition-colors">
                              {faq.question}
                            </h3>
                          </div>
                        </div>

                        <div
                          className={`size-7 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                            isOpen
                              ? "bg-[#e5a924] text-[#191918] border-[#e5a924] rotate-180"
                              : "bg-white/10 text-white/70 border-white/15 group-hover:bg-white/20 group-hover:text-white"
                          }`}
                        >
                          <ChevronDown className="size-4" />
                        </div>
                      </button>

                      {/* Expandable Answer Content */}
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-xs text-[#ede4d5]/85 leading-relaxed font-light border-t border-white/10 animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
                          <p>{faq.answer}</p>

                          {faq.actionText && (
                            <div className="pt-1">
                              {faq.actionType === "reserve" && (
                                <button
                                  type="button"
                                  onClick={() => setReserveModalOpen(true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e5a924] hover:bg-[#d99214] text-[#191918] font-bold text-[0.68rem] uppercase tracking-wider shadow transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                >
                                  <span>{faq.actionText}</span>
                                  <ArrowRight className="size-3" />
                                </button>
                              )}
                              {faq.actionType === "order" && (
                                <button
                                  type="button"
                                  onClick={() => setOrderModalOpen(true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e5a924] hover:bg-[#d99214] text-[#191918] font-bold text-[0.68rem] uppercase tracking-wider shadow transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                >
                                  <span>{faq.actionText}</span>
                                  <ArrowRight className="size-3" />
                                </button>
                              )}
                              {faq.actionType === "map" && (
                                <a
                                  href={site.directionsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#e5a924] hover:text-[#191918] text-[#ede4d5] font-bold text-[0.68rem] uppercase tracking-wider border border-white/15 transition-all cursor-pointer"
                                >
                                  <span>{faq.actionText}</span>
                                  <ArrowUpRight className="size-3" />
                                </a>
                              )}
                              {faq.actionType === "menu" && (
                                <Link
                                  to="/menu"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#e5a924] hover:text-[#191918] text-[#ede4d5] font-bold text-[0.68rem] uppercase tracking-wider border border-white/15 transition-all cursor-pointer"
                                >
                                  <span>{faq.actionText}</span>
                                  <ArrowRight className="size-3" />
                                </Link>
                              )}
                              {faq.actionType === "contact" && (
                                <Link
                                  to="/contact"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#e5a924] hover:text-[#191918] text-[#ede4d5] font-bold text-[0.68rem] uppercase tracking-wider border border-white/15 transition-all cursor-pointer"
                                >
                                  <span>{faq.actionText}</span>
                                  <ArrowRight className="size-3" />
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Still Have Questions Concierge Card */}
          <div className="max-w-3xl mx-auto rounded-2xl bg-gradient-to-br from-[#161f2e] to-[#0d131f] border border-[#e5a924]/30 p-6 sm:p-8 text-center space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 size-32 rounded-full bg-[#e5a924]/10 blur-xl pointer-events-none" />
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#e5a924]">
              <Sparkles className="size-3.5" />
              <span>STILL HAVE A QUESTION?</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
              Our Canyon Concierge is Here to Help
            </h3>
            <p className="text-xs sm:text-sm text-[#ede4d5]/75 font-light max-w-lg mx-auto leading-relaxed">
              Whether you need special table arrangements, dietary consultations, or directions through Hollywoodland, we're just a call or message away.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={site.phoneHref}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-[#e5a924] hover:text-[#191918] text-white font-bold text-xs uppercase tracking-wider border border-white/15 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="size-3.5 text-[#e5a924] group-hover:text-[#191918]" />
                <span>Call Us ({site.phone})</span>
              </a>
              <a
                href={site.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#25D366]/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <WhatsAppIcon className="size-3.5" />
                <span>WhatsApp ("Hello Cafe")</span>
              </a>
              <a
                href={site.gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#ede4d5] font-semibold text-xs border border-white/15 transition-colors"
              >
                <Mail className="size-3.5 text-[#e5a924]" />
                <span>Email Us</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. VISIT US / COME TO BEACHWOOD - REFINED BOUTIQUE DESIGN */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#0c111a] text-white py-12 sm:py-16 lg:py-20">
        {/* Botanical Atmospheric Background with Subtle Dark Foliage */}
        <img
          src="/images/visit_bg.jpg"
          alt="Lush botanical evening ambiance at Beachwood Cafe"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-20 scale-105 transition-transform duration-1000"
        />
        {/* Layered Rich Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c111a] via-[#0c111a]/90 to-[#090d14]" />

        {/* Ambient Animated Glowing Gradient Orbs */}
        <div className="absolute -top-24 left-1/4 w-72 h-72 rounded-full bg-[#d99214]/12 blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full bg-[#1a3b6b]/30 blur-[120px] pointer-events-none" />

        <div className="site-container relative z-10 space-y-8 sm:space-y-10">
          {/* Section Header: Compact, Elegant Typography & Primary Dining Actions */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/10">
            <div className="max-w-xl space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e5a924] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#e5a924]" />
                </span>
                <span className="text-[0.62rem] sm:text-[0.68rem] font-bold tracking-[0.2em] uppercase text-[#e5a924]">
                  VISIT OUR CANYON HOME
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                Come to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5a924] via-[#fcd874] to-[#e5a924] italic font-serif">
                  Beachwood
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-[#ede4d5]/80 max-w-lg font-light leading-relaxed">
                Great food, friendly faces, and a timeless neighborhood sanctuary nestled in the Hollywood Hills since 2012.
              </p>
            </div>

            {/* Primary Dining Action Buttons (Compact Scale) */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/menu"
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#d99214] to-[#c4800b] hover:from-[#e5a924] hover:to-[#d99214] text-[#191918] font-bold text-xs uppercase tracking-wider shadow-md shadow-[#d99214]/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                View Menu
              </Link>
              <button
                type="button"
                onClick={() => setReserveModalOpen(true)}
                className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider border border-white/20 backdrop-blur-md shadow transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Reserve a Table
              </button>
            </div>
          </div>

          {/* Main Grid: Left Bento Info Cards + Right Architectural Map & Navigation */}
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            {/* Left Bento Cards Grid (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bento Card 1: Direct Phone & WhatsApp (Featured Contact Card, spans 2 cols) */}
              <div className="sm:col-span-2 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/15 backdrop-blur-xl p-4 sm:p-5 shadow-lg hover:border-[#e5a924]/40 transition-all duration-300 group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-[#e5a924]/15 border border-[#e5a924]/30 flex items-center justify-center text-[#e5a924] shadow-inner group-hover:scale-105 transition-transform">
                      <Phone className="size-4" />
                    </div>
                    <div>
                      <span className="text-[0.62rem] font-bold tracking-[0.18em] uppercase text-[#e5a924] block">
                        DIRECT CONTACT LINE
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-wide mt-0.5">
                        {site.phone}
                      </h3>
                    </div>
                  </div>
                  <span className="text-[0.72rem] text-[#ede4d5]/60 font-medium">
                    Call or instant WhatsApp
                  </span>
                </div>

                {/* The 2 Non-Duplicated Action Buttons for Phone & WhatsApp */}
                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={site.phoneHref}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-[#e5a924] text-white hover:text-[#191918] font-bold text-xs uppercase tracking-wider border border-white/15 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-sm group/btn"
                  >
                    <Phone className="size-3.5 text-[#e5a924] group-hover/btn:text-[#191918] transition-colors" />
                    <span>Call Directly</span>
                  </a>
                  <a
                    href={site.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#25D366]/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <WhatsAppIcon className="size-3.5" />
                    <span>WhatsApp ("Hello Cafe")</span>
                  </a>
                </div>
              </div>

              {/* Bento Card 2: Email Inquiries (With Direct Gmail & Mail App redirects) */}
              <div className="rounded-xl bg-white/[0.06] border border-white/15 backdrop-blur-xl p-4 sm:p-5 shadow-lg hover:border-[#e5a924]/40 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="size-8 rounded-lg bg-[#e5a924]/15 border border-[#e5a924]/30 flex items-center justify-center text-[#e5a924] group-hover:scale-105 transition-transform">
                      <Mail className="size-4" />
                    </div>
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#e5a924]">
                      EMAIL INQUIRIES
                    </span>
                  </div>
                  <h4 className="text-[0.7rem] font-semibold text-white/70 uppercase tracking-wider">Direct Inbox</h4>
                  <a
                    href={site.gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-xs sm:text-sm font-bold text-white hover:text-[#e5a924] transition-colors block break-all underline-offset-4 hover:underline"
                    title="Click to compose email in Gmail"
                  >
                    {site.email}
                  </a>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                  <a
                    href={site.gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e5a924] hover:bg-[#d99214] text-[#191918] font-bold text-[0.7rem] uppercase tracking-wider shadow transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    title="Open directly in Gmail app or web"
                  >
                    <Mail className="size-3" />
                    <span>Open in Gmail</span>
                    <ArrowUpRight className="size-3" />
                  </a>
                  <a
                    href={site.emailHref}
                    onClick={() => {
                      window.location.href = site.emailHref;
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#ede4d5] font-semibold text-[0.7rem] border border-white/15 transition-colors"
                    title="Open with your device's default mail app"
                  >
                    <span>Mail App</span>
                  </a>
                </div>
              </div>

              {/* Bento Card 3: Hours of Operation */}
              <div className="rounded-xl bg-white/[0.06] border border-white/15 backdrop-blur-xl p-4 sm:p-5 shadow-lg hover:border-[#e5a924]/40 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="size-8 rounded-lg bg-[#e5a924]/15 border border-[#e5a924]/30 flex items-center justify-center text-[#e5a924] group-hover:scale-105 transition-transform">
                      <Clock className="size-4" />
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[0.62rem] font-bold uppercase tracking-wider">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Open Daily</span>
                    </div>
                  </div>
                  <h4 className="text-[0.7rem] font-semibold text-white/70 uppercase tracking-wider">Hours of Service</h4>
                  <div className="mt-2 space-y-1 text-xs text-[#ede4d5]/85 leading-relaxed font-medium">
                    <p className="flex justify-between">
                      <span className="text-white/60">Mon – Thu:</span>
                      <span className="font-bold text-white">8:00am – 4:00pm</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-white/60">Fri – Sun:</span>
                      <span className="font-bold text-white">8:00am – 9:00pm</span>
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 text-[0.68rem] text-[#ede4d5]/60 font-medium">
                  Breakfast, brunch, & evening dinner
                </div>
              </div>

              {/* Bento Card 4: Location & Social Links (spans 2 cols) */}
              <div className="sm:col-span-2 rounded-xl bg-white/[0.05] border border-white/15 backdrop-blur-xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#e5a924]/40 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-[#e5a924]/15 border border-[#e5a924]/30 flex items-center justify-center text-[#e5a924] shrink-0 mt-0.5">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#e5a924] block">
                      NEIGHBORHOOD ADDRESS
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                      2695 N Beachwood Dr, Los Angeles, CA 90068
                    </p>
                    <p className="text-[0.72rem] text-[#ede4d5]/65 mt-0.5">
                      Historic Hollywoodland Village at the base of Beachwood Canyon
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={site.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#e5a924] text-[#ede4d5] hover:text-[#191918] text-xs font-semibold transition-all duration-200 border border-white/15"
                  >
                    <Instagram className="size-3" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href={site.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#e5a924] text-[#ede4d5] hover:text-[#191918] text-xs font-semibold transition-all duration-200 border border-white/15"
                  >
                    <span className="font-serif font-black text-xs leading-none">f</span>
                    <span>Facebook</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Architectural Map Graphic Card + Aligned Get Directions Card (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Luxury Architectural Map Graphic Card */}
              <div className="flex-1 rounded-xl overflow-hidden bg-gradient-to-b from-[#161d2b] to-[#0f1420] border border-white/20 shadow-xl group/map flex flex-col min-h-[220px]">
                {/* HUD Header with Compass & Coordinates */}
                <div className="px-3.5 py-2 bg-black/40 border-b border-white/10 flex items-center justify-between text-[0.62rem] font-mono tracking-wider text-[#ede4d5]/70 shrink-0">
                  <div className="flex items-center gap-1.5 text-[#e5a924]">
                    <Compass className="size-3 anim-spin-slow" />
                    <span className="font-bold">34.1199° N, 118.3213° W</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-sans text-[0.58rem] font-bold tracking-widest uppercase">
                    ELEV. 750 FT
                  </span>
                </div>

                {/* Stylized Architectural Canyon Map SVG Graphic */}
                <div className="relative flex-1 w-full min-h-[200px] overflow-hidden bg-[#101724] flex items-center justify-center select-none">
                  {/* Map Grid and Topographic Roads Graphic */}
                  <svg className="absolute inset-0 w-full h-full opacity-65" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Topographic Elevation Contours */}
                    <path d="M-20 50 C 60 90, 140 30, 240 70 C 340 120, 420 60, 450 100" stroke="#1f2c42" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M-30 110 C 70 140, 160 80, 260 130 C 360 180, 430 120, 460 160" stroke="#1f2c42" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M-10 170 C 90 200, 180 150, 280 180 C 380 220, 440 180, 460 210" stroke="#1f2c42" strokeWidth="1.5" strokeDasharray="3 3" />

                    {/* Canyon Valley Main Roads */}
                    <path d="M70 -20 Q 110 80, 200 112 T 310 250" stroke="#2a3b57" strokeWidth="7" strokeLinecap="round" />
                    <path d="M70 -20 Q 110 80, 200 112 T 310 250" stroke="#d99214" strokeWidth="2.2" strokeOpacity="0.8" strokeLinecap="round" />
                    <path d="M-20 70 Q 90 105, 200 112 T 420 90" stroke="#2a3b57" strokeWidth="5.5" strokeLinecap="round" />
                    <path d="M-20 70 Q 90 105, 200 112 T 420 90" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
                    <path d="M200 112 L 200 240" stroke="#2a3b57" strokeWidth="4.5" />
                    <path d="M200 112 L 200 240" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="4 3" />

                    {/* Street Labels */}
                    <text x="75" y="40" fill="#ffffff" fillOpacity="0.4" fontSize="7.5" fontFamily="monospace" transform="rotate(35 75 40)">N BEACHWOOD DR</text>
                    <text x="260" y="80" fill="#ffffff" fillOpacity="0.4" fontSize="7.5" fontFamily="monospace">BELDEN DR</text>
                    <text x="135" y="195" fill="#ffffff" fillOpacity="0.4" fontSize="7.5" fontFamily="monospace">HOLLYWOODLAND</text>
                  </svg>

                  {/* Concentric Animated Radar Ping Waves from Cafe Location */}
                  <div className="absolute top-[50%] left-[50%] size-28 rounded-full border-2 border-[#e5a924]/60 anim-radar-wave-1 pointer-events-none" />
                  <div className="absolute top-[50%] left-[50%] size-28 rounded-full border-2 border-[#e5a924]/60 anim-radar-wave-2 pointer-events-none" />
                  <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 size-12 rounded-full bg-[#e5a924]/15 border border-[#e5a924]/60 anim-beacon pointer-events-none" />

                  {/* Interactive Pin Marker with Golden Crest */}
                  <div className="relative z-10 flex flex-col items-center anim-pin-bob">
                    <div className="size-8 rounded-full bg-gradient-to-tr from-[#1a3b6b] to-[#e5a924] p-0.5 shadow-xl shadow-[#e5a924]/50 flex items-center justify-center">
                      <div className="size-full rounded-full bg-[#0e141f] flex items-center justify-center">
                        <MapPin className="size-4 text-[#e5a924] fill-[#e5a924]" />
                      </div>
                    </div>
                    <div className="mt-1.5 px-3 py-0.5 rounded-full bg-black/90 backdrop-blur-md border border-[#e5a924]/50 shadow-lg flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-[#e5a924] animate-ping" />
                      <span className="text-[0.66rem] font-bold tracking-wider text-white">
                        BEACHWOOD CAFE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Get Directions Navigation Card - Aligned with Neighborhood Address Card */}
              <div className="rounded-xl bg-white/[0.05] border border-white/15 backdrop-blur-xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#e5a924]/40 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-[#e5a924]/15 border border-[#e5a924]/30 flex items-center justify-center text-[#e5a924] shrink-0 mt-0.5">
                    <Navigation className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#e5a924] block">
                        GPS NAVIGATION
                      </span>
                      <span className="text-[0.58rem] font-mono font-bold text-[#e5a924] px-1.5 py-0.5 rounded bg-[#e5a924]/10 border border-[#e5a924]/20">
                        LIVE GPS
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                      Beachwood Canyon · Hollywood
                    </h4>
                    <p className="text-[0.72rem] text-[#ede4d5]/65 mt-0.5">
                      Direct route via Google Maps
                    </p>
                  </div>
                </div>

                <a
                  href={site.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#e5a924] hover:bg-[#d99214] text-[#191918] font-bold text-xs uppercase tracking-wider shadow-md shadow-[#e5a924]/20 shrink-0 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
                >
                  <Navigation className="size-3.5 fill-current" />
                  <span>Get Directions</span>
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Centered The Canyon Dispatch Luxury Newsletter Card */}
          <div className="pt-2 max-w-2xl mx-auto w-full">
            <div className="rounded-xl bg-gradient-to-br from-[#161f2e]/90 to-[#0e1420]/95 border border-[#e5a924]/30 backdrop-blur-xl p-5 sm:p-6 shadow-xl shadow-[#e5a924]/5 text-center space-y-3 relative overflow-hidden">
              {/* Subtle Amber Glow Center */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 size-40 rounded-full bg-[#e5a924]/15 blur-2xl pointer-events-none anim-pulse-glow" />

              <div className="inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#e5a924]">
                <Sparkles className="size-3.5 text-[#e5a924] anim-spin-medium" />
                <span>THE CANYON DISPATCH</span>
              </div>

              <p className="text-xs font-light text-[#ede4d5]/85 leading-relaxed max-w-lg mx-auto">
                Receive seasonal menu debuts, holiday service hours, and neighborhood stories directly in your inbox.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-1">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#e5a924] focus:ring-1 focus:ring-[#e5a924] transition-all"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-[#e5a924] hover:bg-[#d99214] text-[#191918] font-bold text-xs uppercase tracking-wider shrink-0 shadow shadow-[#e5a924]/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Join</span>
                  <Send className="size-3" />
                </button>
              </form>

              {newsletterSubscribed && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 animate-in fade-in pt-1">
                  <CheckCircle2 className="size-3.5" />
                  <span>Welcome to our canyon community!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>


      {/* Dish Modal */}
      <DishModal dish={selectedDish} onClose={() => setSelectedDish(null)} />

      {/* Reservation & Order Modals */}
      <ReservationModal isOpen={reserveModalOpen} onClose={() => setReserveModalOpen(false)} />
      <OrderModal isOpen={orderModalOpen} onClose={() => setOrderModalOpen(false)} />
    </>
  );
}
