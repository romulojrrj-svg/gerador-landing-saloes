import { StaticPremiumV1 } from "./premium/v1/StaticPremiumV1";
import { PremiumEditorialLanding } from "../../src/components/landing/premium-editorial/v2/PremiumEditorialLanding";
import { appSalon, salon } from "../lib/salon";

export default function StaticSalonPage() {
  return salon.templateVersion === "premium_editorial_v2" ? (
    <PremiumEditorialLanding salon={appSalon} />
  ) : (
    <StaticPremiumV1 />
  );
}
