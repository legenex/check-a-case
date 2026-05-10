import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import AdvNavbar from "@/components/advertorial/AdvNavbar";
import AdvFinalCta from "@/components/advertorial/AdvFinalCta";
import InlineMiniCta from "@/components/advertorial/InlineMiniCta";
import MidSplitBlock from "@/components/advertorial/MidSplitBlock";
import MinimalLegalFooter from "@/components/public/MinimalLegalFooter";
import { Clock, User } from "lucide-react";

const mdComponents = {
  p: ({ children }) => <p className="text-foreground/85 leading-relaxed mb-4">{children}</p>,
  h2: ({ children }) => <h2 className="text-2xl font-black text-foreground mt-8 mb-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-bold text-foreground mt-6 mb-2">{children}</h3>,
  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
  a: ({ href, children }) => <a href={href} className="text-primary underline">{children}</a>,
};

function renderBody(body_markdown, adv, slug) {
  if (!body_markdown) return null;

  const blocks = body_markdown
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  let inlineCtaIndex = 0;
  let midImageRendered = false;
  const elements = [];

  blocks.forEach((block, i) => {
    const trimmed = block.trim();

    // Match CTA markers
    if (/^\[(INLINE_CTA|CTA_INLINE)[_\-\s]?\d*\]$/i.test(trimmed)) {
      elements.push(
        <InlineMiniCta
          key={`cta-${i}`}
          position={inlineCtaIndex}
          slug={slug}
          href={adv.mid_cta_url}
        />
      );
      inlineCtaIndex++;
      return;
    }

    // Match mid-image markers
    if (/^\[(MID_IMAGE|MID_SPLIT|MID_PHOTO)\]$/i.test(trimmed)) {
      midImageRendered = true;
      elements.push(<MidSplitBlock key={`mid-${i}`} adv={adv} slug={slug} />);
      return;
    }

    // Drop unrecognized bracket-only placeholders
    if (/^\[[A-Z0-9_\-]+\]$/i.test(trimmed) && trimmed.length < 60) {
      return;
    }

    elements.push(
      <ReactMarkdown key={`md-${i}`} components={mdComponents}>
        {block}
      </ReactMarkdown>
    );
  });

  // Fallback: inject mid-image at positional index if no marker was found
  if (!midImageRendered && (adv.mid_image_url || adv.mid_image_headline)) {
    const insertAfter = adv.mid_image_insert_after_paragraph ?? 4;
    // Find the Nth markdown block (non-CTA, non-mid) and insert after it
    let mdCount = 0;
    let insertIdx = elements.length; // default: end
    for (let j = 0; j < elements.length; j++) {
      const k = elements[j]?.key || "";
      if (String(k).startsWith("md-")) {
        mdCount++;
        if (mdCount >= insertAfter) {
          insertIdx = j + 1;
          break;
        }
      }
    }
    elements.splice(insertIdx, 0, <MidSplitBlock key="mid-fallback" adv={adv} slug={slug} />);
  }

  return elements;
}

export default function AdvertorialPage() {
  const { slug } = useParams();

  const { data: advertorials = [], isLoading } = useQuery({
    queryKey: ["advertorial", slug],
    queryFn: () => base44.entities.Advertorial.filter({ slug }),
  });

  const adv = advertorials[0];

  useEffect(() => {
    if (adv?.seo_title) document.title = adv.seo_title;
    else if (adv?.title) document.title = adv.title;
  }, [adv]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!adv || adv.status !== "published") {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Article not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AdvNavbar slug={slug} finalCtaUrl={adv.final_cta_url} />

      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Pull quote / eyebrow */}
          {adv.pull_quote && (
            <div className="mb-6 text-sm font-semibold uppercase tracking-widest text-primary">
              {adv.pull_quote}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight mb-5">
            {adv.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
            {adv.author_name && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {adv.author_name}
              </span>
            )}
            {adv.read_time_minutes > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {adv.read_time_minutes} min read
              </span>
            )}
          </div>

          {/* Hero image */}
          {adv.hero_image_url && (
            <div className="mb-8 rounded-2xl shadow-sm overflow-hidden aspect-[16/9]">
              <img
                src={adv.hero_image_url}
                alt={adv.hero_image_alt || adv.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
              {adv.hero_image_caption && (
                <p className="text-xs text-muted-foreground text-center mt-2">{adv.hero_image_caption}</p>
              )}
            </div>
          )}

          {/* Body: marker-aware renderer */}
          <div className="lg:px-16 prose prose-lg max-w-none">
            {renderBody(adv.body, adv, slug)}
          </div>

          {/* Final CTA */}
          <AdvFinalCta finalCtaUrl={adv.final_cta_url} slug={slug} />
        </div>
      </main>

      <MinimalLegalFooter />
    </div>
  );
}