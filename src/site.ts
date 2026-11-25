import pageCopy from './data/page-copy.json';

export const SITE_NAME = pageCopy.site.name;
export const SITE_DESCRIPTION = pageCopy.site.description;
export const OWNER_HANDLE = pageCopy.about.handle;

const envAddress = import.meta.env.PUBLIC_CONTACT_EMAIL?.trim() ?? '';
export const CONTACT_EMAIL = /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(envAddress) ? envAddress : '';

export const SOCIAL_LINKS = {
  github: {
    label: 'GitHub',
    handle: 'moonoops',
    href: 'https://github.com/moonoops',
  },
} as const;

export function formatCopy(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : placeholder
  );
}
