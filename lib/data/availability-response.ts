import type { Customer } from "@/lib/customer-types";
import type {
  CabinPageData,
  QuadPageData,
  SaunaPageData,
} from "./public-types";

/** The activities with a live booking form on their service page. */
export type LiveActivity = "pirtis" | "nakvyne" | "keturraciai";

/** Body of `GET /api/availability?activity=`: the activity's current availability and who is signed in. */
export type AvailabilityResponse = { customer: Customer | null } & (
  | { activity: "pirtis"; data: SaunaPageData }
  | { activity: "nakvyne"; data: CabinPageData }
  | { activity: "keturraciai"; data: QuadPageData }
);
