import { MotionConfig } from "framer-motion";
import { useNavigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import LandingNav from "../components/landing/LandingNav";
import ProblemSection from "../components/landing/ProblemSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import ProofSection from "../components/landing/ProofSection";
import FinalCTASection from "../components/landing/FinalCTASection";
import LandingFooter from "../components/landing/LandingFooter";
import { useSharedOptimizerStore } from "../store/optimizerStore";

export default function Home() {
  const navigate = useNavigate();
  const setLabView = useSharedOptimizerStore((state) => state.setLabView);

  const start = () => navigate("/app/surface");
  const openLabs = () => {
    setLabView("surface");
    navigate("/app/surface");
  };

  return (
    <MotionConfig reducedMotion="user">
      <div id="landing-scroll" className="h-screen w-full overflow-y-auto overflow-x-hidden scroll-smooth bg-slate-950 font-sans text-slate-300 selection:bg-slate-700 selection:text-white">
        <LandingNav onStart={start} />
        <main>
          <HeroSection onStart={start} onLabs={openLabs} />
          <ProblemSection />
          <FeaturesSection />
          <ProofSection />
          <FinalCTASection onStart={start} />
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
