import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Valdymas", template: "%s · Vanduo Marse valdymas" },
  robots: { index: false, follow: false },
};

/** Shared by the login page and the signed-in panel (see `(panel)/layout.tsx`). */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
