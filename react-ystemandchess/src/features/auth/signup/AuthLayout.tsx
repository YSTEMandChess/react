import { ReactNode } from "react";
import { Link } from "react-router-dom";
import mascot from "../../../assets/images/student/STEMy_Mascot_transparent.png";
import OnboardingSteps from "./OnboardingSteps";

type SideLink = { label: string; to: string };

type AuthLayoutProps = {
  panelTitle: string;
  step?: number;
  tightSides?: boolean;
  links?: SideLink[];
  children: ReactNode;
};

const defaultLinks: SideLink[] = [
  { label: "Benefit of Chess", to: "/benefit-of-chess" },
  { label: "Benefit of Math Tutoring", to: "/benefit-of-math-tutoring" },
  { label: "Benefit of Computer Science", to: "/benefit-of-computer-science" },
  { label: "Benefit of Mentoring", to: "/benefit-of-mentoring" },
];

const AuthLayout = ({ panelTitle, step, tightSides, links = defaultLinks, children }: AuthLayoutProps) => {
  return (
    <div className="min-h-[71vh] flex items-center gap-8 px-4 lg:px-60 py-12">
      <aside className={`hidden lg:flex flex-col justify-center gap-10 w-64 shrink-0 ${tightSides ? "lg:ml-48" : ""}`}>
        {links.map((b) => (
          <Link key={b.to} to={b.to} className="btn-yellow w-full text-center py-6">
            {b.label}
          </Link>
        ))}
      </aside>

      <div className="flex-1 flex flex-col items-center">
        {typeof step === "number" && <OnboardingSteps current={step} />}
        {children}
      </div>

      <aside className={`hidden lg:flex flex-col items-center justify-center gap-6 w-72 shrink-0 ${tightSides ? "lg:mr-48" : ""}`}>
        <img src={mascot} alt="STEMy mascot" className="w-full h-auto" />
        <p className="text-center text-2xl font-bold text-dark leading-relaxed">
          {panelTitle}
        </p>
      </aside>
    </div>
  );
};

export default AuthLayout;
