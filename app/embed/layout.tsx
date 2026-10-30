import type { Metadata } from "next";
import { EmbedFrame } from "@/components/embed/embed-frame";

/** Widget pages live on other sites; the full pages are the ones to index. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: LayoutProps<"/embed">) {
  return <EmbedFrame>{children}</EmbedFrame>;
}
