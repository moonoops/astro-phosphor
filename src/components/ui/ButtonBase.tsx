import type { ComponentPropsWithoutRef } from 'react';

type Variant = 'primary' | 'secondary' | 'icon';
type Common = { variant?: Variant };
type LinkKey = Common & ComponentPropsWithoutRef<'a'> & { href: string };
type ButtonKey = Common & ComponentPropsWithoutRef<'button'> & { href?: undefined };
type Props = LinkKey | ButtonKey;

export default function ButtonBase(props: Props) {
  const { variant = 'secondary', className, ...attributes } = props;
  const classes = ['pixel-key', `pixel-key--${variant}`, className].filter(Boolean).join(' ');

  if (attributes.href !== undefined) {
    return <a {...attributes} className={classes} />;
  }

  const { href, type = 'button', ...button } = attributes;
  return <button {...button} type={type} className={classes} />;
}
