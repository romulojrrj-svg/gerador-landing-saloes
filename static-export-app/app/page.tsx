import { StaticPremiumV1 } from "./premium/v1/StaticPremiumV1";
import { PremiumEditorialLanding } from "../../src/components/landing/premium-editorial/v2/PremiumEditorialLanding";
import { appSalon, salon } from "../lib/salon";
import { CookiePreferencesLink, MetaTracking } from "./meta/MetaTracking";

const metaIntegration = salon.integrations?.meta;
const isJuliaStaticExport =
  salon.slug === "dra-julia-maia-2" ||
  salon.slug === "julia-maia-harmonizacao-facial" ||
  salon.customDomain === "drajuliammaia.com.br";

export default function StaticSalonPage() {
  return (
    <>
      <MetaTracking
        config={metaIntegration}
        automatic={isJuliaStaticExport}
        privacyUrl={salon.premiumEditorial.interactiveQuiz?.privacyUrl}
      />
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
