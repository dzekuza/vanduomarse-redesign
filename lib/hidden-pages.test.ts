import { describe, expect, it } from "vitest";
import { hrefSlug, isHiddenHref, withoutHiddenLinks } from "./hidden-pages";

describe("hidden service page links", () => {
  it("reads the slug of internal hrefs only", () => {
    expect(hrefSlug("/keturraciu-nuoma")).toBe("keturraciu-nuoma");
    expect(hrefSlug("/sventes#rezervuoti")).toBe("sventes");
    expect(hrefSlug("/rezervacija?veikla=pirtis")).toBe("rezervacija");
    expect(hrefSlug("/")).toBeNull();
    expect(hrefSlug("/#kryptys")).toBeNull();
    expect(hrefSlug("https://example.com/pirtis")).toBeNull();
    expect(hrefSlug("//example.com")).toBeNull();
  });

  it("matches only hidden pages", () => {
    expect(isHiddenHref("/keturraciu-nuoma", ["keturraciu-nuoma"])).toBe(true);
    expect(isHiddenHref("/keturraciai", ["keturraciu-nuoma"])).toBe(false);
  });

  it("drops hidden links and dropdown children", () => {
    const links = [
      { href: "/#kryptys", label: "Pramogos", children: [{ href: "/pirtis", label: "Pirtis" }, { href: "/keturraciu-nuoma", label: "Keturračiai" }] },
      { href: "/restoranas", label: "Skoniai" },
      { href: "/renginiai", label: "Renginiai" },
    ];
    expect(withoutHiddenLinks(links, ["keturraciu-nuoma", "restoranas"])).toEqual([
      { href: "/#kryptys", label: "Pramogos", children: [{ href: "/pirtis", label: "Pirtis" }] },
      { href: "/renginiai", label: "Renginiai" },
    ]);
    expect(withoutHiddenLinks(links, [])).toEqual(links);
  });
});
