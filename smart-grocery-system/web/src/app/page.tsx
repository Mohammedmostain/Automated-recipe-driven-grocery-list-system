'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Recipe {
  id: string;
  title: string;
  servings: number;
  ingredients: Ingredient[];
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    api.get('/recipes')
      .then((res) => setRecipes(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null; // AuthContext handles redirect

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Recipes</h1>
        <div className="space-x-4">
          <Link 
            href="/recipes/new" 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            + Add Recipe
          </Link>
          <button 
            onClick={logout} 
            className="text-red-500 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {loading ? (
        <p className="text-center text-gray-500">Loading your recipes...</p>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow">
          <p className="text-xl text-gray-600 mb-4">You haven't added any recipes yet.</p>
          <Link href="/recipes/new" className="text-blue-500 hover:underline">Create your first one now!</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <h2 className="text-xl font-bold mb-2">{recipe.title}</h2>
              <p className="text-sm text-gray-500 mb-4">Serves: {recipe.servings}</p>
              
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Ingredients:</h3>
              <ul className="text-sm space-y-1 mb-4">
                {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                  <li key={idx} className="truncate">
                    • {ing.quantity} {ing.unit} {ing.name}
                  </li>
                ))}
                {recipe.ingredients.length > 3 && (
                  <li className="text-gray-400 text-xs italic">+ {recipe.ingredients.length - 3} more</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}