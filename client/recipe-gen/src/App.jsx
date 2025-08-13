import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const RecipeCard = ({ onSubmit }) => {
  const [ingredients, setIngredients] = useState("");
  const [mealType, setMealType] = useState("Lunch");
  const [cuisine, setCuisine] = useState("");
  const [cookingTime, setCookingTime] = useState("Less than 30 minutes");
  const [complexity, setComplexity] = useState("Beginner");



  const handleSubmit = () => {
    const recipeData = {
      ingredients,
      mealType,
      cuisine,
      cookingTime,
      complexity,
    };
    onSubmit(recipeData);
  };

  return (
    <div className="w-[400px] border rounded-lg overflow-hidden shadow-lg bg-white">
      <div className="px-6 py-4">
        <div className="bg-gray-800 text-white text-xl font-bold py-2 px-4 rounded-t-lg shadow-sm mb-6">Recipe Generator</div>

        {[
          { label: "Ingredients", id: "ingredients", value: ingredients, setter: setIngredients, placeholder: "e.g., eggs, onion" },
          { label: "Cuisine", id: "cuisine", value: cuisine, setter: setCuisine, placeholder: "e.g., Italian, Mexican" },
        ].map((field, i) => (
          <div key={i} className="mb-4">
            <label htmlFor={field.id} className="block text-gray-700 text-sm font-bold mb-2">{field.label}</label>
            <input
              id={field.id}
              name={field.id}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              type="text"
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
            />
          </div>
        ))}

        <div className="relative mb-4">
          <label htmlFor="mealType" className="block text-gray-700 text-sm font-bold mb-2">Meal Type</label>
          <select
            id="mealType"
            name="mealType"
            value={mealType}
            onChange={(e) => setMealType(e.target.value)} className="form-select w-full shadow border rounded appearance-none py-2 px-3 pr-8 relative">
            {["Breakfast", "Lunch", "Dinner", "Snack"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {/* Custom arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-4 top-1/3 flex items-center">
            <svg
              className="h-5 w-5 text-gray-700"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="relative mb-4">
          <label htmlFor="cookingTime" className="block text-gray-700 text-sm font-bold mb-2">Cooking Time</label>
          <select
            id="cookingTime"
            name="cookingTime"
            value={cookingTime}
            onChange={(e) => setCookingTime(e.target.value)} className="form-select w-full shadow border rounded appearance-none py-2 px-3">
            {["Less than 30 minutes", "30-60 minutes", "More than 1 hour"].map((time) => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
          {/* Custom arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-4 top-1/3 flex items-center">
            <svg
              className="h-5 w-5 text-gray-700"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="relative mb-4">
          <label htmlFor="complexity" className="block text-gray-700 text-sm font-bold mb-2">Complexity</label>
          <select
            id="complexity"
            name="complexity"
            value={complexity} onChange={(e) => setComplexity(e.target.value)} className="form-select w-full shadow border rounded appearance-none py-2 px-3">
            {["Beginner", "Intermediate", "Advanced"].map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {/* Custom arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-4 top-1/3 flex items-center">
            <svg
              className="h-5 w-5 text-gray-700"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <button
          className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleSubmit}
        >
          Generate Recipe
        </button>
      </div>
    </div>
  );
};

const Navbar = () => {
  return (
    <nav className="w-full h-22 bg-blue-900 text-white py-4 px-6 shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center space-x-4">
        <img src="/my_recipe_generator_2.jpeg" alt="Logo" className="w-14 h-14 rounded-full overflow-hidden" />
        <div className="text-xl font-bold">My Recipe App</div>
      </div>
    </nav>
  );
};

function App() {
  const [recipeData, setRecipeData] = useState(null); // Will hold { id }
  const [recipeText, setRecipeText] = useState("");
  const eventSourceRef = useRef(null);

  const closeEventStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // This function sends the recipe form data to the backend and gets back an ID
  const handleRecipeSubmit = async (formData) => {
    setRecipeText("");
    try {
      // POST recipe form data to backend
      const response = await fetch("http://localhost:3000/recipeRequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create recipe request");
      }

      const { id } = await response.json();

      // Set the ID in state so SSE can start
      setRecipeData({ id });

    } catch (error) {
      console.error("Error creating recipe request:", error);
    }
  };


  // Initialize SSE connection once we have a recipe request ID
  const initializeEventStream = useCallback(() => {
    if (!recipeData || !recipeData.id) return;

    const url = `http://localhost:3000/recipeStream/${recipeData.id}`;
    // setRecipeText(""); // Clear previous text

    // closeEventStream();

    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === "close") {
        closeEventStream();
      } else if (data.action === "chunk") {
        setRecipeText((prev) => prev + data.chunk);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error("Error with SSE", error);
      closeEventStream();
    };
  }, [recipeData]);

  useEffect(() => {
    if (recipeData) {
      initializeEventStream();
    }
    return () => {
      closeEventStream();
    };
  }, [recipeData, initializeEventStream]);

  return (
    <div className="App">
      <Navbar />

      {/* Add top padding so content is not hidden behind navbar */}
      <div className="pt-16 flex flex-col items-center my-6"></div>
      <div className="flex flex-row items-start justify-center my-6 space-x-6">
        <RecipeCard onSubmit={handleRecipeSubmit} />
        <div className="w-[600px] h-[570px] border rounded-lg shadow p-4 overflow-y-auto text-sm text-gray-800 bg-white space-y-4">
          {recipeText ? (
            <>
              {recipeText.split("\n").map((line, index) => {
                if (line.toLowerCase().includes("ingredients")) {
                  return (
                    <div key={index}>
                      <hr className="my-3 border-t-2 border-gray-500" />
                      <strong>{line}</strong>
                    </div>
                  );
                } else if (line.toLowerCase().includes("instructions")) {
                  return (
                    <div key={index}>
                      <hr className="my-3 border-t-2 border-gray-500" />
                      <strong>{line}</strong>
                    </div>
                  );
                } else {
                  return <p key={index} className="whitespace-pre-wrap">{line}</p>;
                }
              })}
            </>
          ) : (
            "Generated recipe will appear here..."
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
