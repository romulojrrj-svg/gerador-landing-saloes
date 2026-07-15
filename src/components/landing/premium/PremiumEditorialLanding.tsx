import {
  PREMIUM_EDITORIAL_V2,
  normalizePremiumEditorialVersion,
} from "@/lib/premium-editorial";
import type { Salon } from "@/types/salon";
import { PremiumEditorialLanding as PremiumEditorialV1 } from "../premium-editorial/v1/PremiumEditorialLanding";
import { PremiumEditorialLanding as PremiumEditorialV2 } from "../premium-editorial/v2/PremiumEditorialLanding";

/**
 * Keep the public import stable while dispatching to an immutable visual version.
 * Missing versions intentionally resolve to v1 for backwards compatibility.
 */
export function PremiumEditorialLanding({ salon }: { salon: Salon }) {
  const version = normalizePremiumEditorialVersion(salon.templateVersion);
  const Component = version === PREMIUM_EDITORIAL_V2
    ? PremiumEditorialV2
    : PremiumEditorialV1;

  return <Component salon={salon} />;
}
