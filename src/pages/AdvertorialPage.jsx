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

function BodyWithMidBlock({ body, adv, slug }) {
  if (!body) return null;

  const insertAfter = adv.mid_image_insert_after_paragraph ?? 4;
  const hasMidBlock = !!(adv.mid_image_url || adv.mid_image_headline);

  // Split body on the special marker or inject after N paragraphs
  let before = body;
  let after = "";

  if (body.includes("[MID_IMAGE]")) {
    const parts = body.split("[MID_IMAGE]");
    before = parts[0];
    after = parts.slice(1).join("");
  } else if (hasMidBlock) {
    // Split on paragraph breaks
    const paragraphs = body.split(/\n\n+/);
    const splitAt = Math.min(insertAfter, paragraphs.length - 1);
    before = paragraphs.slice(0, splitAt).join("\n\n");
    after = paragraphs.slice(splitAt).join("\n\n");
  }

  return (
    <>
      <ReactMarkdown className="prose prose-lg max-w-none prose-headings:font-black prose-headings:text-foreground prose-p:text-foreground/85 prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground">
        {before}
      </ReactMarkdown>

      {hasMidBlock && <MidSplitBlock adv={adv} slug={slug} />}

      {after && (
        <ReactMarkdown className="prose prose-lg max-w-none prose-headings:font-black prose-headings:text-foreground prose-p:text-foreground/85 prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground">
          {after}
        </ReactMarkdown>
      )}
    </>
  );
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
        <div className="max-w-[860px] mx-auto px-4 sm:px-6">

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

          {/* First inline CTA */}
          <InlineMiniCta position={0} slug={slug} href={adv.mid_cta_url} />

          {/* Body with optional mid-block */}
          <BodyWithMidBlock body={adv.body} adv={adv} slug={slug} />

          {/* Second inline CTA */}
          <InlineMiniCta position={1} slug={slug} href={adv.mid_cta_url} />

          {/* Final CTA */}
          <AdvFinalCta finalCtaUrl={adv.final_cta_url} slug={slug} />
        </div>
      </main>

      <MinimalLegalFooter />
    </div>
  );
}