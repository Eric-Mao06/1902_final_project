export default function MetaTags() {
  return (
    <>
      {/* Essential Meta Tags */}
      <meta property="og:title" content="Linkd" />
      <meta property="og:description" content="Connect with school alumni" />
      <meta property="og:image" content="https://pennlinkd.com/LinkdPreview.png" />
      <meta property="og:url" content="https://pennlinkd.com" />
      <meta name="twitter:card" content="summary_large_image" />

      {/* Additional Meta Tags */}
      <meta property="og:site_name" content="Linkd" />
      <meta property="og:type" content="website" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Specific */}
      <meta name="twitter:title" content="Linkd" />
      <meta name="twitter:description" content="Connect with school alumni" />
      <meta name="twitter:image" content="https://pennlinkd.com/LinkdPreview.png" />

      {/* Additional SEO */}
      <meta name="description" content="Connect with school alumni" />
    </>
  );
}
