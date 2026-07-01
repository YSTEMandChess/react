import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { environment } from "../../../environments/environment";
import mascot from "../../../assets/images/student/STEMy_Mascot_transparent.png";
import OnboardingSteps from "./OnboardingSteps";

type Child = {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
};

const ParentSection = () => {
  const [cookies] = useCookies(["login"]);
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await fetch(`${environment.urls.middlewareURL}/user/children`, {
          method: "GET",
          headers: { Authorization: `Bearer ${cookies.login}` },
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setChildren(data);
      } catch (error) {
        setChildren([]);
      }
    };
    fetchChildren();
  }, [cookies.login]);

  return (
    <div className="min-h-[71vh] px-4 py-12 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <OnboardingSteps current={1} />

        <div className="flex items-center gap-4 mb-8">
          <img src={mascot} alt="STEMy mascot" className="hidden sm:block w-16 h-auto" />
          <div>
            <h1 className="text-4xl font-bold text-dark">Your Children</h1>
            <p className="text-lg text-gray">Select a child to open their page, or add another.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 bg-light rounded-3xl border-2 border-dark shadow-md p-8 flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-dark">Children</h2>

            {children.length === 0 && (
              <p className="text-base text-gray">No children added yet. Add your first child to get started.</p>
            )}

            {children.map((child) => (
              <button
                key={child._id}
                type="button"
                onClick={() => setSelected(child._id)}
                className={`group flex items-center gap-4 w-full rounded-xl border-2 px-5 py-4 text-left transition-all ${
                  selected === child._id
                    ? "border-primary bg-soft ring-2 ring-primary/30"
                    : "border-borderLight bg-white hover:border-primary hover:scale-[1.02]"
                }`}
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-light text-xl font-bold shrink-0">
                  {(child.firstName || child.username || "?").charAt(0).toUpperCase()}
                </span>
                <span className="flex flex-col">
                  <span className="text-lg font-bold text-dark">{child.firstName || child.username}</span>
                  <span className="text-sm text-gray">@{child.username}</span>
                </span>
                {selected === child._id && (
                  <svg className="ml-auto w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={() => navigate("/signup/parent/add-child")}
              className="btn-yellow w-full mt-2"
            >
              Add Another Child
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={!selected}
              className="flex flex-col items-center justify-center gap-4 w-full max-w-[16rem] aspect-square mx-auto rounded-2xl bg-primary text-light text-xl font-semibold shadow-md transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Go to Student Page
            </button>
            {!selected && (
              <p className="text-sm text-muted text-center">Select a child to continue</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentSection;
