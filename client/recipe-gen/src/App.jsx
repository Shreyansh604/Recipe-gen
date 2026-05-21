import { useEffect, useRef, useState } from "react";
import "./App.css";


const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3000"; // Fixed: env var

// ─── Reusable select field ─────────────────────────────────────────────────────

const SelectField = ({ label, id, value, onChange, options }) => (
  <div className="relative mb-4">
    <label htmlFor={id} className="block text-gray-700 text-sm font-bold mb-2">
      {label}
    </label>
    <select
      id={id}
      name={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="form-select w-full shadow border rounded appearance-none py-2 px-3 pr-8 text-gray-700 focus:outline-none focus:shadow-outline"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {/* ✅ Fixed: extracted shared arrow icon */}
    <div className="pointer-events-none absolute inset-y-0 right-4 top-1/3 flex items-center">
      <svg className="h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
);

// ─── Recipe form card ──────────────────────────────────────────────────────────

const RecipeCard = ({ onSubmit, isLoading }) => {
  const [ingredients, setIngredients] = useState("");
  const [mealType, setMealType] = useState("Lunch");
  const [cuisine, setCuisine] = useState("");
  const [cookingTime, setCookingTime] = useState("Less than 30 minutes");
  const [complexity, setComplexity] = useState("Beginner");

  const handleSubmit = () => {
    if (!ingredients.trim()) return;
    onSubmit({ ingredients, mealType, cuisine, cookingTime, complexity });
  };

  return (
    <div className="w-[400px] border rounded-lg overflow-hidden shadow-lg bg-white">
      <div className="px-6 py-4">
        <div className="bg-gray-800 text-white text-xl font-bold py-2 px-4 rounded-t-lg shadow-sm mb-6">
          Recipe Generator
        </div>

        {/* Text inputs */}
        {[
          { label: "Ingredients", id: "ingredients", value: ingredients, setter: setIngredients, placeholder: "e.g., eggs, onion" },
          { label: "Cuisine", id: "cuisine", value: cuisine, setter: setCuisine, placeholder: "e.g., Italian, Mexican" },
        ].map((field) => (
          <div key={field.id} className="mb-4">
            <label htmlFor={field.id} className="block text-gray-700 text-sm font-bold mb-2">
              {field.label}
            </label>
            <input
              id={field.id}
              name={field.id}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              type="text"
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
              disabled={isLoading}
            />
          </div>
        ))}

        {/* ✅ Fixed: deduplicated select fields */}
        <SelectField
          label="Meal Type"
          id="mealType"
          value={mealType}
          onChange={setMealType}
          options={["Breakfast", "Lunch", "Dinner", "Snack"]}
        />
        <SelectField
          label="Cooking Time"
          id="cookingTime"
          value={cookingTime}
          onChange={setCookingTime}
          options={["Less than 30 minutes", "30-60 minutes", "More than 1 hour"]}
        />
        <SelectField
          label="Complexity"
          id="complexity"
          value={complexity}
          onChange={setComplexity}
          options={["Beginner", "Intermediate", "Advanced"]}
        />

        <button
          className="bg-blue-500 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
          onClick={handleSubmit}
          disabled={isLoading || !ingredients.trim()}
        >
          {isLoading ? "Generating…" : "Generate Recipe"}
        </button>
      </div>
    </div>
  );
};

// ─── Navbar ────────────────────────────────────────────────────────────────────

const Navbar = () => (
  <nav className="w-full bg-blue-900 text-white py-4 px-6 shadow-md fixed top-0 left-0 z-50">
    <div className="max-w-7xl mx-auto flex items-center space-x-4">
      <img src="/my_recipe_generator_2.jpeg" alt="Logo" className="w-14 h-14 rounded-full overflow-hidden" />
      <div className="text-xl font-bold">My Recipe App</div>
    </div>
  </nav>
);

// ─── Recipe line renderer ──────────────────────────────────────────────────────

const RecipeLine = ({ line, index }) => {
  if (!line.trim()) return <div key={index} className="h-2" />;

  const renderInline = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

  // ### Headings
  if (line.startsWith("### ")) {
    return (
      <div key={index}>
        <hr className="my-3 border-t-2 border-gray-300" />
        <p className="font-bold text-gray-900 text-lg">{renderInline(line.replace(/^###\s*/, ""))}</p>
      </div>
    );
  }

  // ## Headings
  if (line.startsWith("## ")) {
    return (
      <div key={index}>
        <hr className="my-3 border-t-2 border-gray-300" />
        <p className="font-bold text-gray-900 text-xl">{renderInline(line.replace(/^##\s*/, ""))}</p>
      </div>
    );
  }

  // --- divider
  if (line.trim() === "---") {
    return <hr key={index} className="my-3 border-t border-gray-200" />;
  }

  // Numbered list: 1. or Step 1:
  if (line.match(/^\d+\./) || line.match(/^Step\s+\d+/i)) {
    return (
      <p key={index} className="pl-4 text-gray-700 font-medium whitespace-pre-wrap">
        {renderInline(line)}
      </p>
    );
  }

  // Bullet: - or *
  if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith(". ")) {
    return (
      <p key={index} className="pl-4 before:content-['•'] before:mr-2 before:text-blue-400 whitespace-pre-wrap text-gray-700">
        {renderInline(line.replace(/^[-*.]\s*/, ""))}
      </p>
    );
  }

  // *italic* single star lines (recipe name etc)
  if (line.startsWith("*") && line.endsWith("*")) {
    return (
      <p key={index} className="italic text-gray-600 whitespace-pre-wrap">
        {line.replace(/^\*|\*$/g, "")}
      </p>
    );
  }

  return (
    <p key={index} className="whitespace-pre-wrap text-gray-700">
      {renderInline(line)}
    </p>
  );
};

// ─── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [recipeRequestId, setRecipeRequestId] = useState(null); // Fixed: renamed from recipeData
  const [recipeText, setRecipeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);           // Fixed: loading state
  const [error, setError] = useState(null);                    // Fixed: error state
  const eventSourceRef = useRef(null);

  const closeEventStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const handleRecipeSubmit = async (formData) => {
    closeEventStream(); // Fixed: always close previous stream before starting new one
    setRecipeText("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/recipeRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to create recipe request.");
      }

      setRecipeRequestId(json.id);
    } catch (err) {
      console.error("Error creating recipe request:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Fixed: useCallback removed — logic lives directly in useEffect
  useEffect(() => {
    if (!recipeRequestId) return;

    const url = `${API_BASE}/recipeStream/${recipeRequestId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.action === "chunk") {
        setRecipeText((prev) => prev + data.chunk);
      } else if (data.action === "close") {
        setIsLoading(false);
        closeEventStream();
      } else if (data.action === "error") {
        setError(data.message || "An error occurred while generating the recipe.");
        setIsLoading(false);
        closeEventStream();
      }
    };

    es.onerror = () => {
      setError("Connection to server lost. Please try again.");
      setIsLoading(false);
      closeEventStream();
    };

    return () => closeEventStream();
  }, [recipeRequestId]);

  return (
    <div className="App min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-24 flex flex-col items-center">
        <div className="flex flex-row items-start justify-center my-6 space-x-6 w-full max-w-5xl px-4">
          <RecipeCard onSubmit={handleRecipeSubmit} isLoading={isLoading} />

          <div className="w-[600px] min-h-[570px] border rounded-lg shadow p-6 bg-white space-y-2 overflow-y-auto">
            {/* ✅ Fixed: error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* ✅ Fixed: loading indicator */}
            {isLoading && !recipeText && (
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Generating your recipe…</span>
              </div>
            )}

            {recipeText
              ? recipeText.split("\n").map((line, i) => <RecipeLine key={i} line={line} index={i} />)
              : !isLoading && !error && (
                  <p className="text-gray-400 text-sm">Generated recipe will appear here…</p>
                )
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
