import { useEffect, useRef, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import PulseLogo from './PulseLogo';
import { BiMoon, BiSun } from 'react-icons/bi';

const heroSlides = [
  {
    label: 'Portfolio radar',
    title: 'Wallet-specific risk snapshots',
    description:
      'Pulse AI reads your actual wallet context so small and large portfolios do not get the same generic advice.',
    metrics: [
      ['Risk posture', 'Adaptive'],
      ['SOL context', 'Wallet aware'],
      ['Coverage', 'Portfolio + tokens'],
    ],
    tags: ['Real-time analysis', 'Wallet native', 'Explainable signals'],
    footnote: 'Built to turn balances, exposure, and volatility into clearer decisions.',
  },
  {
    label: 'AI decision layer',
    title: 'Actionable guidance without shallow signals',
    description:
      'Generate market briefs, inspect token setups, and surface the reasons behind each recommendation before acting.',
    metrics: [
      ['Signal engine', 'Multi-factor'],
      ['Market brief', 'AI generated'],
      ['Clarity', 'Decision ready'],
    ],
    tags: ['Token discovery', 'AI insights', 'Risk scoring'],
    footnote: 'Pulse AI helps move from market noise to wallet-specific next steps.',
  },
  {
    label: 'Protocol integrity',
    title: 'Advice that can be committed on-chain',
    description:
      'Risk profiles, advice commitments, and position intents can be recorded for traceability as the app moves protocol-first.',
    metrics: [
      ['Profile state', 'On-chain'],
      ['Commitments', 'Auditable'],
      ['Mode', 'Devnet simulation'],
    ],
    tags: ['Anchor protocol', 'Intent recording', 'Policy aware'],
    footnote: 'The frontend stays useful while the protocol layer keeps decisions durable.',
  },
];

const features = [
  {
    title: 'Wallet-native intelligence',
    description:
      'Recommendations adapt to the connected wallet, current holdings, and live portfolio risk instead of showing one-size-fits-all ideas.',
    accent: 'Personalized analysis',
    icon: 'wallet',
  },
  {
    title: 'AI guidance with context',
    description:
      'Pulse AI combines market briefs, token analysis, and discovery flows so you can inspect both opportunity and exposure in one workspace.',
    accent: 'Explainable signals',
    icon: 'trending',
  },
  {
    title: 'Auditable protocol path',
    description:
      'Risk profiles, advice commitments, and position intents are designed for integrity as the product matures toward protocol-first execution.',
    accent: 'Traceable decisions',
    icon: 'shield',
  },
];

const workflowItems = [
  {
    step: 'Step 1',
    title: 'Connect your Solana wallet',
    description:
      'Pulse AI starts with your actual wallet. Open the modal, connect, and let the app load balances, holdings, and portfolio context.',
    points: ['Non-custodial wallet adapter flow', 'Context starts from your address', 'Designed for devnet experimentation'],
    stat: 'Entry point: wallet first',
  },
  {
    step: 'Step 2',
    title: 'Analyze risk before acting',
    description:
      'Move through dashboard, token discovery, and AI insights to understand concentration, volatility, and opportunity before making a move.',
    points: ['Real-time portfolio scoring', 'AI market brief and token analysis', 'Discovery and swap flows in one workspace'],
    stat: 'Decision layer: analysis first',
  },
  {
    step: 'Step 3',
    title: 'Record what matters on-chain',
    description:
      'When advice needs integrity, Pulse AI records user risk profile state, commitments, and position intent for traceability.',
    points: ['UserRiskProfile and RiskPolicy domains', 'AdviceCommitment payload path', 'Position intent recording on devnet'],
    stat: 'Protocol layer: integrity first',
  },
];

function BrandMark() {
  return <PulseLogo size={44} className="pulse-brand-logo" />;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 14.2A8.6 8.6 0 0 1 9.8 4a8.9 8.9 0 1 0 10.2 10.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 6-6 6 6 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.2 7.2c-2.7 1.2-4.2 3.5-4.2 6.7 0 1.6 1.2 2.9 2.7 2.9A2.8 2.8 0 0 0 11.5 14c0-1.5-1.1-2.8-2.5-2.9.2-1.1.8-2 1.9-2.9l-.7-1ZM18.2 7.2C15.5 8.4 14 10.7 14 13.9c0 1.6 1.2 2.9 2.7 2.9a2.8 2.8 0 0 0 2.8-2.8c0-1.5-1.1-2.8-2.5-2.9.2-1.1.8-2 1.9-2.9l-.7-1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6H18a2 2 0 0 1 2 2v1.5H6.5a1.5 1.5 0 0 0 0 3H20V16a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 15.5v-7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="16.5" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m5 15 5-5 3.2 3.2L19 7.5M14 7h5v5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.8 18.2 6v5.3c0 4.1-2.4 7.7-6.2 9.1-3.8-1.4-6.2-5-6.2-9.1V6L12 3.8Zm-2.1 8.4 1.6 1.6 3.6-3.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const iconMap = {
  wallet: WalletIcon,
  trending: TrendingIcon,
  shield: ShieldIcon,
};

function LandingHeroHeading({ text, accentText }) {
  let letterIndex = 0;
  const accentStart = accentText ? text.indexOf(accentText) : -1;
  const accentEnd = accentStart >= 0 && accentText ? accentStart + accentText.length : -1;

  const renderSegment = (segmentText, isAccent = false) =>
    segmentText.split(/(\s+)/).map((token, tokenIndex) => {
      if (!token) return null;

      if (/^\s+$/.test(token)) {
        return (
          <span key={`space-${isAccent ? 'accent' : 'base'}-${tokenIndex}`} className="pulse-hero-headline-space">
            {token.replace(/ /g, '\u00A0')}
          </span>
        );
      }

      return (
        <span
          key={`word-${isAccent ? 'accent' : 'base'}-${tokenIndex}-${token}`}
          className="pulse-hero-headline-word"
        >
          {Array.from(token).map((letter) => {
            const currentLetterIndex = letterIndex;
            letterIndex += 1;

            return (
              <span
                key={`${tokenIndex}-${currentLetterIndex}-${letter}`}
                className={`pulse-hero-headline-letter${isAccent ? ' pulse-hero-headline-letter-accent' : ''}`}
                style={{ '--hero-letter-delay': `${currentLetterIndex * 0.03}s` }}
              >
                {letter}
              </span>
            );
          })}
        </span>
      );
    });

  return (
    <h1 aria-label={text}>
      <span className="pulse-hero-headline" aria-hidden="true">
        {accentStart >= 0 && accentEnd >= 0 ? (
          <>
            {renderSegment(text.slice(0, accentStart))}
            {renderSegment(text.slice(accentStart, accentEnd), true)}
            {renderSegment(text.slice(accentEnd))}
          </>
        ) : (
          renderSegment(text)
        )}
      </span>
    </h1>
  );
}

function LandingHeader({
  isConnected,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onGetStarted,
  onExplore,
  theme,
  onToggleTheme,
}) {
  return (
    <header className="pulse-navbar">
      <a href="#top" className="pulse-brand" onClick={onCloseMenu}>
        <BrandMark />
        <span>Pulse AI</span>
      </a>

      <div className={`pulse-nav-actions${isMenuOpen ? ' pulse-nav-actions-open' : ''}`}>
        <a href="#how-it-works" className="pulse-nav-link" onClick={onCloseMenu}>
          How it works
        </a>
        <a href="#features" className="pulse-nav-link" onClick={onCloseMenu}>
          Features
        </a>
        {isConnected ? (
          <button type="button" className="pulse-nav-button" onClick={() => { onCloseMenu(); onExplore(); }}>
            Dashboard
          </button>
        ) : (
          <button type="button" className="pulse-nav-button" onClick={() => { onCloseMenu(); onGetStarted(); }}>
            Get started
          </button>
        )}
      </div>

      <div className="pulse-header-tools">
        {theme === 'dark' ?
          <BiSun
            style={{ width: "30px", height: "30px" }}
            onClick={onToggleTheme} />
          :
          <BiMoon
            style={{ width: "30px", height: "30px" }}
            onClick={onToggleTheme} />}

        {isConnected && <WalletMultiButton />}

        <button
          type="button"
          className="pulse-mobile-menu-toggle"
          onClick={onToggleMenu}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {isMenuOpen && <button type="button" className="pulse-mobile-overlay" onClick={onCloseMenu} aria-label="Close menu" />}
    </header>
  );
}

function LandingHeroVisual({ slides }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 6400);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  return (
    <div className="pulse-hero-photo-card">
      <div className="pulse-hero-photo-stage">
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            className={`pulse-hero-image-slide${index === activeIndex ? ' pulse-hero-image-slide-active' : ''}`}
            aria-hidden={index !== activeIndex}
          >
            <article className="pulse-hero-panel">
              <div className="pulse-hero-panel-top">
                <span className="pulse-hero-panel-label">{slide.label}</span>
                <span className="pulse-hero-panel-indicator" />
              </div>

              <div className="pulse-hero-panel-copy">
                <h3>{slide.title}</h3>
                <p>{slide.description}</p>
              </div>

              <div className="pulse-hero-panel-grid">
                {slide.metrics.map(([label, value]) => (
                  <div key={label} className="pulse-hero-panel-metric">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              <div className="pulse-hero-panel-tags">
                {slide.tags.map((tag) => (
                  <span key={tag} className="pulse-hero-panel-tag">{tag}</span>
                ))}
              </div>

              <p className="pulse-hero-panel-footnote">{slide.footnote}</p>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingFeatureGrid({ items }) {
  const [isVisible, setIsVisible] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.18 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={gridRef} className="pulse-feature-grid">
      {items.map(({ title, description, accent, icon }, index) => {
        const Icon = iconMap[icon];

        return (
          <article
            key={title}
            className={`pulse-feature-card${isVisible ? ' pulse-feature-card-visible' : ''}`}
            style={{ '--feature-delay': `${index * 140}ms` }}
          >
            <span className="pulse-feature-icon">
              <Icon />
            </span>
            <span className="pulse-feature-accent">{accent}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        );
      })}
    </div>
  );
}

function WorkflowSection({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 14000);

    return () => window.clearInterval(intervalId);
  }, [items.length]);

  const activeItem = items[activeIndex];

  return (
    <section id="how-it-works" className="pulse-testimonial-section">
      <div className="pulse-testimonial-intro">
        <span className="pulse-section-eyebrow">Workflow</span>
        <h2>Pulse AI moves from wallet context to AI guidance and then into auditable protocol actions.</h2>
      </div>

      <div className="pulse-testimonial-shell">
        <button
          type="button"
          className="pulse-testimonial-button pulse-testimonial-button-left"
          onClick={() => setActiveIndex((current) => (current - 1 + items.length) % items.length)}
          aria-label="Show previous workflow step"
        >
          <ChevronLeftIcon />
        </button>

        <div className="pulse-testimonial-card">
          <div className="pulse-testimonial-quote-mark">
            <QuoteIcon />
          </div>

          <span className="pulse-workflow-step">{activeItem.step}</span>
          <h3 className="pulse-workflow-title">{activeItem.title}</h3>
          <p className="pulse-testimonial-quote">{activeItem.description}</p>

          <div className="pulse-workflow-list">
            {activeItem.points.map((point) => (
              <div key={point} className="pulse-workflow-item">
                <span className="pulse-workflow-dot" />
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="pulse-testimonial-meta">
            <div className="pulse-testimonial-identity">
              <div className="pulse-testimonial-avatar">
                <span>{activeIndex + 1}</span>
              </div>

              <div>
                <strong>Pulse AI flow</strong>
                <span>From insight to action</span>
              </div>
            </div>
            <div className="pulse-testimonial-stat">{activeItem.stat}</div>
          </div>
        </div>

        <button
          type="button"
          className="pulse-testimonial-button pulse-testimonial-button-right"
          onClick={() => setActiveIndex((current) => (current + 1) % items.length)}
          aria-label="Show next workflow step"
        >
          <ChevronRightIcon />
        </button>

        <div className="pulse-testimonial-dots" aria-label="Workflow selector">
          {items.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={`pulse-testimonial-dot${index === activeIndex ? ' pulse-testimonial-dot-active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${item.title}`}
              aria-pressed={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFooter({ isConnected, onGetStarted, onExplore }) {
  return (
    <footer className="pulse-footer">
      <div>
        <h2>Pulse AI</h2>
        <p>AI-guided, wallet-native risk management for Solana with a clear path toward auditable on-chain decisions.</p>
      </div>
      <div>
        <h2>Landing</h2>
        <a href="#how-it-works">How it works</a>
        <a href="#features">Features</a>
      </div>
      <div>
        <h2>App access</h2>
        {isConnected ? (
          <button type="button" className="pulse-footer-action" onClick={onExplore}>Open dashboard</button>
        ) : (
          <button type="button" className="pulse-footer-action" onClick={onGetStarted}>Connect wallet</button>
        )}
      </div>
      <div>
        <h2>Protocol path</h2>
        <a href="#how-it-works">Advice commitments</a>
        <a href="#features">Risk profile flow</a>
      </div>
    </footer>
  );
}

export default function PulseLandingPage({
  isConnected,
  theme,
  onToggleTheme,
  onGetStarted,
  onExplore,
  onOpenInsights,
  onOpenDiscover,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const closeMenu = () => setIsMenuOpen(false);
    window.addEventListener('resize', closeMenu);
    return () => window.removeEventListener('resize', closeMenu);
  }, [isMenuOpen]);

  return (
    <div className="pulse-landing-page" id="top">
      <main>
        <section className="pulse-hero-section">
          <div className="pulse-hero-inner">
            <LandingHeader
              isConnected={isConnected}
              isMenuOpen={isMenuOpen}
              onToggleMenu={() => setIsMenuOpen((current) => !current)}
              onCloseMenu={() => setIsMenuOpen(false)}
              onGetStarted={onGetStarted}
              onExplore={onExplore}
              theme={theme}
              onToggleTheme={onToggleTheme}
            />

            <div className="pulse-hero-shell">
              <div className="pulse-hero-backdrop" aria-hidden="true" />

              <div className="pulse-hero-copy">
                {/* <span className="pulse-eyebrow">Wallet-native risk intelligence</span> */}
                <LandingHeroHeading
                  text="Solana risk management that feels clear, specific, and ready for action."
                  accentText="risk management"
                />
                <p>
                  Pulse AI combines live portfolio analysis, token discovery, AI decision support,
                  and an on-chain commitment path so your next move can be both informed and traceable.
                </p>

                <div className="pulse-hero-actions">
                  {isConnected ? (
                    <>
                      <button type="button" className="pulse-primary-button" onClick={onExplore}>
                        Explore Pulse AI
                        <ArrowRightIcon />
                      </button>
                      <button type="button" className="pulse-secondary-button" onClick={onOpenInsights}>
                        Open AI insights
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="pulse-primary-button" onClick={onGetStarted}>
                        Get started
                        <ArrowRightIcon />
                      </button>
                      <a href="#how-it-works" className="pulse-secondary-button">
                        See how it works
                      </a>
                    </>
                  )}
                </div>

                {/* <div className="pulse-hero-inline-links">
                  <button type="button" className="pulse-inline-link" onClick={onOpenDiscover} disabled={!isConnected}>
                    {isConnected ? 'Jump to token discovery' : 'Connect to unlock discovery'}
                  </button>
                  <span className="pulse-inline-separator" aria-hidden="true" />
                  <a href="#features" className="pulse-inline-link">Review core capabilities</a>
                </div> */}
              </div>

              <div className="pulse-hero-visual">
                <LandingHeroVisual slides={heroSlides} />
              </div>
            </div>
          </div>
        </section>

        <WorkflowSection items={workflowItems} />

        <section id="features" className="pulse-feature-section">
          <div className="pulse-section-heading">
            <span className="pulse-section-eyebrow">Core value</span>
            <h2>Product surfaces that help you inspect risk, act deliberately, and keep a stronger integrity trail.</h2>
          </div>

          <LandingFeatureGrid items={features} />
        </section>
      </main>

      <LandingFooter
        isConnected={isConnected}
        onGetStarted={onGetStarted}
        onExplore={onExplore}
      />
    </div>
  );
}
