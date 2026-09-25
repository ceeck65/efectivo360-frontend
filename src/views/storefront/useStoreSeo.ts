import { onBeforeUnmount } from 'vue';
import { publicStoreUrl, type StorePayload } from './storefront';

// Metadatos de la tienda para buscadores y redes (título, descripción, Open Graph, canonical y
// JSON-LD de tipo Store). Al salir de la tienda se restaura lo que había.
export function useStoreSeo() {
  const created: Element[] = [];
  const previous = new Map<Element, string | null>();
  const originalTitle = document.title;

  function upsert(selector: string, create: () => HTMLElement, attr: string, value: string) {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = create();
      document.head.appendChild(el);
      created.push(el);
    } else if (!previous.has(el)) {
      previous.set(el, el.getAttribute(attr));
    }
    el.setAttribute(attr, value);
  }

  function meta(key: 'name' | 'property', name: string, content: string) {
    upsert(
      `meta[${key}="${name}"]`,
      () => {
        const el = document.createElement('meta');
        el.setAttribute(key, name);
        return el;
      },
      'content',
      content
    );
  }

  function apply(payload: StorePayload, productCount = 0) {
    const { store, config } = payload;
    const title = config.seoTitle || [store.name, config.tagline].filter(Boolean).join(' | ');
    const location = [store.city, store.state].filter(Boolean).join(', ');
    const description =
      config.seoDescription ||
      config.description ||
      `Compra en línea en ${store.name}${location ? ` (${location})` : ''}. ${productCount ? `${productCount} productos disponibles. ` : ''}Pide por WhatsApp y paga en USD o bolívares.`;
    const url = publicStoreUrl(store.slug);
    const image = config.banners.find((b) => b.imageUrl)?.imageUrl || store.logo;

    document.title = title;
    meta('name', 'description', description.slice(0, 160));
    meta('name', 'robots', payload.preview ? 'noindex, nofollow' : 'index, follow');
    meta('property', 'og:type', 'website');
    meta('property', 'og:site_name', store.name);
    meta('property', 'og:title', title);
    meta('property', 'og:description', description.slice(0, 200));
    meta('property', 'og:url', url);
    if (image) meta('property', 'og:image', image);
    meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    meta('name', 'theme-color', config.brand);

    upsert(
      'link[rel="canonical"]',
      () => {
        const el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        return el;
      },
      'href',
      url
    );

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: store.name,
      url,
      image: image || undefined,
      logo: store.logo || undefined,
      description,
      telephone: store.phone || undefined,
      email: store.email || undefined,
      address: store.address
        ? {
            '@type': 'PostalAddress',
            streetAddress: store.address,
            addressLocality: store.city || undefined,
            addressRegion: store.state || undefined,
            addressCountry: 'VE',
          }
        : undefined,
      sameAs: store.socials.map((s) => s.url).filter((u) => /^https?:\/\//.test(u)),
    };
    upsert(
      'script[data-store-jsonld]',
      () => {
        const el = document.createElement('script');
        el.setAttribute('type', 'application/ld+json');
        el.setAttribute('data-store-jsonld', '');
        return el;
      },
      'data-store',
      store.slug
    );
    document.head.querySelector('script[data-store-jsonld]')!.textContent = JSON.stringify(jsonLd);
  }

  onBeforeUnmount(() => {
    document.title = originalTitle;
    created.forEach((el) => el.remove());
    previous.forEach((value, el) => {
      const attr = el.tagName === 'LINK' ? 'href' : 'content';
      if (value === null) el.removeAttribute(attr);
      else el.setAttribute(attr, value);
    });
  });

  return { apply };
}
