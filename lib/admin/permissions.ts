/**
 * Admin pages a role can be given. The keys match `staff_roles_permissions_known`
 * in the database: each one grants read and write on that page's data, plus
 * read-only access to the data the page shows from elsewhere (see the hints).
 * Staff management is not a permission: only the Owner role has it.
 */
export const PERMISSIONS = [
  { id: "apzvalga", label: "Apžvalga", href: "/admin", hint: "Šiandienos tvarkaraštis ir suvestinė. Mato rezervacijas, užklausas ir renginius (tik peržiūra)." },
  { id: "rezervacijos", label: "Rezervacijos", href: "/admin/rezervacijos", hint: "Pirties ir nakvynės rezervacijos: statusai, naujos rezervacijos, eksportas, užimtumo kalendorius." },
  /** Folded into the Rezervacijos page's "Kalendorius" tab; kept as its own permission so existing roles keep calendar/closing-hour access without a DB migration. */
  { id: "uzimtumas", label: "Užimtumas", href: "/admin/rezervacijos?view=kalendorius", hint: "Užimtumo kalendorius Rezervacijų skiltyje: pirties valandų uždarymas. Mato rezervacijas ir keturračius (tik peržiūra)." },
  { id: "uzklausos", label: "Užklausos", href: "/admin/uzklausos", hint: "Renginių užklausos, būsenos ir pastabos." },
  { id: "keturraciai", label: "Keturračiai", href: "/admin/keturraciai", hint: "Nuomos užklausos, registracijos į žygius, parkas ir taisyklės." },
  { id: "kuponai", label: "Kuponai", href: "/admin/kuponai", hint: "Kuponų užsakymai, apmokėjimo patvirtinimas, panaudojimas ir katalogas." },
  { id: "nuolaidos", label: "Nuolaidos", href: "/admin/nuolaidos", hint: "Nuolaidų kodai rezervacijoms: kūrimas, galiojimas, išjungimas ir panaudojimai." },
  { id: "renginiai", label: "Renginiai", href: "/admin/renginiai", hint: "Renginių ir žygių kūrimas, paskelbimas ir bilietai." },
  { id: "pirtis", label: "Pirtis", href: "/admin/pirtis", hint: "Pirties kainos, taisyklės ir priedai." },
  { id: "kainos", label: "Kainodara", href: "/admin/kainos", hint: "Visas kainų sąrašas." },
  { id: "apyrankes", label: "Apyrankės", href: "/admin/apyrankes", hint: "Apyrankių skenavimas, planų pardavimas ir katalogas." },
  { id: "klientai", label: "Klientai", href: "/admin/klientai", hint: "Klientų sąrašas ir profiliai: kontaktai, apyrankės, rezervacijų ir pirkimų istorija, dokumentai, komentarai." },
  { id: "instruktorius", label: "Instruktorius", href: "/admin/instruktorius", hint: "Apyrankės skenavimas vandenyje: naudotojo kortelė ir dabartinės sesijos trukmė. Mato naudotojus, planus ir apyrankes (tik peržiūra)." },
] as const;

export type PermissionId = (typeof PERMISSIONS)[number]["id"];

export const PERMISSION_IDS = PERMISSIONS.map((p) => p.id) as [PermissionId, ...PermissionId[]];

export const permissionLabel = (id: PermissionId) => PERMISSIONS.find((p) => p.id === id)!.label;

export const isPermissionId = (value: string): value is PermissionId => (PERMISSION_IDS as string[]).includes(value);

/** Where owners manage staff and roles. */
export const STAFF_HREF = "/admin/darbuotojai";

/** Where owners flip site-wide switches (the "coming soon" gate). Owner-only. */
export const SITE_SETTINGS_HREF = "/admin/svetaine";

/** Where owners edit the texts, FAQ and photos of the public service pages. Owner-only. */
export const PAGE_CONTENT_HREF = "/admin/puslapiai";

/** Where owners choose which phone numbers get staff SMS. Owner-only, like staff management. */
export const NOTIFICATIONS_HREF = "/admin/pranesimai";

/** The signed-in staff member and what they may open. */
export interface StaffAccess {
  userId: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  isOwner: boolean;
  permissions: PermissionId[];
}

type Grants = Pick<StaffAccess, "isOwner" | "permissions">;

export const hasPermission = (access: Grants, permission: PermissionId) => access.isOwner || access.permissions.includes(permission);

export const hasAnyPermission = (access: Grants, permissions: readonly PermissionId[]) => permissions.some((p) => hasPermission(access, p));

/** First page a person may open, or null when their role has none. */
export function firstAllowedHref(access: Grants): string | null {
  if (access.isOwner) return "/admin";
  return PERMISSIONS.find((p) => access.permissions.includes(p.id))?.href ?? null;
}
