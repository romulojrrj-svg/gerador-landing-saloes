import { StaticPremiumV1 } from "./premium/v1/StaticPremiumV1";
import { PremiumEditorialLanding } from "../../src/components/landing/premium-editorial/v2/PremiumEditorialLanding";
import { appSalon, salon } from "../lib/salon";
import { CookiePreferencesLink, MetaTracking } from "./meta/MetaTracking";

const metaIntegration = salon.integrations?.meta;

export default function StaticSalonPage() {
  return (
    <>
      <MetaTracking config={metaIntegration} />
      {salon.templateVersion === "premium_editorial_v2" ? (
        <PremiumEditorialLanding
          salon={appSalon}
          footerAccessory={<CookiePreferencesLink enabled={Boolean(metaIntegration?.enabled)} />}
        />
      ) : (
        <StaticPremiumV1 />
      )}
    </>
  );
}
