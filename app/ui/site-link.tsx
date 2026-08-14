import type { AnchorHTMLAttributes, ReactNode } from "react";
import { withBasePath } from "@/app/site-path";

type SiteLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

/**
 * A document navigation is deliberately used for the core guide routes.
 * Cached HTML stays dependable when iOS reports a connection that cannot
 * actually reach the network, while hashed assets still come from the PWA cache.
 */
export function SiteLink({ href, children, ...props }: SiteLinkProps) {
  return <a href={withBasePath(href)} {...props}>{children}</a>;
}
