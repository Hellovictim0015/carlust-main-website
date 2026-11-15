import { Suspense } from "react";
import { HideOnMobileHome } from "@/components/layout/HideOnMobileHome";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <WishlistProvider>
      <div className="flex min-h-dvh flex-col pb-16 md:pb-0">
        <Suspense fallback={<SiteHeader />}>
          <HideOnMobileHome>
            <SiteHeader />
          </HideOnMobileHome>
        </Suspense>
        <main className="flex-1">{children}</main>
        <Suspense fallback={<SiteFooter />}>
          <HideOnMobileHome>
            <SiteFooter />
          </HideOnMobileHome>
        </Suspense>
        <Suspense>
          <MobileTabBar />
        </Suspense>
      </div>
    </WishlistProvider>
  );
}
