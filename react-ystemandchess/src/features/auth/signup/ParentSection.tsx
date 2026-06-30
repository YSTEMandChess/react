import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { environment } from "../../../environments/environment";

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
    <div className="min-h-[71vh] flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-dark mb-6">Parent Section</h2>

        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <h3 className="text-xl font-bold text-dark">Children</h3>

            {children.map((child) => (
              <button
                key={child._id}
                type="button"
                onClick={() => setSelected(child._id)}
                className={`w-full rounded-lg border-2 px-4 py-3 text-sm font-semibold text-dark bg-white transition-colors ${
                  selected === child._id ? "border-primary" : "border-borderLight hover:border-primary"
                }`}
              >
                {child.firstName || child.username}
              </button>
            ))}

            <button
              type="button"
              onClick={() => navigate("/signup/parent/add-child")}
              className="btn-yellow text-base"
            >
              Add Another Child
            </button>
          </div>

          <div className="flex justify-center md:justify-end">
            <button
              type="button"
              disabled={!selected}
              className="btn-green"
            >
              Go to Student Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentSection;
