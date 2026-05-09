import LandingTestimonials from "./ui/landing-testimonials";
import LandingHeader from "./ui/landing-header";
import LandingFooter from "./ui/landing-footer";
import LandingFeatureGrid from "./ui/landing-feature-grid";
import LandingHeroHeading from "./ui/landing-hero-heading";
import LandingHeroVisual from "./ui/landing-hero-visual";
import { LandingHeroCta } from "@/components/shared/landing-hero-cta";
import styles from "./page.module.css";

const features: Array<{
    title: string;
    description: string;
    accent: string;
    icon: "wallet" | "trending" | "shield";
}> = [
    {
        title: "Spend-ready balances",
        description:
            "See what is available now, what is earning, and what needs to move next without hunting across screens.",
        accent: "Daily clarity",
        icon: "wallet",
    },
    {
        title: "Yield without friction",
        description:
            "Put idle funds into flexible savings and keep the experience lightweight enough for everyday use.",
        accent: "Passive growth",
        icon: "trending",
    },
    {
        title: "Calm operational control",
        description:
            "Move stablecoins confidently with a simpler flow, cleaner numbers, and less noise around each action.",
        accent: "Confident movement",
        icon: "shield",
    },
];

const testimonials = [
    {
        quote:
            "Stash is the first stablecoin app I have used that feels calm enough for daily money movement. I do not need to think twice before opening it.",
        name: "Amara Yusuf",
        role: "Operations lead",
        stat: "Treasury transfers every week",
        image: "/happy customer.jpg",
    },
    {
        quote:
            "The savings flow feels simple, not intimidating. I can see what is available, what is earning, and move between both without the usual confusion.",
        name: "Daniel Cole",
        role: "Founder",
        stat: "Uses flexible vaults daily",
        image: "/customer.jpg",
    },
    {
        quote:
            "What kept me around was the clarity. It feels more like a polished neobank than a crypto dashboard stitched together from too many ideas.",
        name: "Teni Adebayo",
        role: "Finance manager",
        stat: "Runs team payouts in USDC",
        image: "/happy customer.jpg",
    },
];

const heroImages = [
    {
        src: "/happy customer.jpg",
        alt: "Happy customer using Stash on a mobile phone",
        position: "center 18%",
    },
    {
        src: "/customer.jpg",
        alt: "Customer smiling while using Stash",
        position: "center 22%",
    },
    {
        src: "/stash22.jpg",
        alt: "Friends planning a trip together with Stash",
        position: "center 30%",
    },
];

export default function Home() {
    return (
        <>
            <main className={styles.landingPage}>
                <section className={styles.heroSection}>
                    <div className={styles.heroInner}>
                        <LandingHeader />

                        <div className={styles.heroShell}>
                            <div className={styles.heroBackdrop} aria-hidden="true" />

                            <div className={styles.heroCopy}>
                                <LandingHeroHeading
                                    text="Digital dollar banking that feels calm, clear, and beautifully simple."
                                    accentText="dollar banking"
                                />
                                <p>
                                    Stash brings spending, transfers, and savings into one thoughtful workspace
                                    for people who want stablecoin money management to feel less technical and
                                    more natural.
                                </p>

                                <LandingHeroCta />
                            </div>

                            <div className={styles.heroVisual}>
                                <LandingHeroVisual images={heroImages} />
                            </div>
                        </div>
                    </div>
                </section>

                <LandingTestimonials items={testimonials} />

                <section className={styles.featureSection}>
                    <div className={styles.sectionHeading}>
                        <span className={styles.sectionEyebrow}>Core value</span>
                        <h2>Useful features, presented with a little more taste.</h2>
                    </div>

                    <LandingFeatureGrid items={features} />
                </section>
            </main>
            <LandingFooter />
        </>
    );
}
