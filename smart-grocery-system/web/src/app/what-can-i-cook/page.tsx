'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface MissingIngredient {
  name: string;
  missing_qty: string;
  unit: string;
}

interface RecipeMatch {
  id: string;
  title: string;
  servings: number;
  match_percentage: number;
  missing_ingredients: MissingIngredient[];
}

export default function WhatCanICook() {
  const { user } = useAuth();

  const { data: suggestions, isLoading } = useQuery<RecipeMatch[]>({
    queryKey: ['recipe-suggestions'],
    queryFn: async () => (await api.get('/recipes/suggestions')).data,
    enabled: !!user
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">What Can I Cook?</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        {isLoading ? (
          <p className="text-gray-500">Analyzing your fridge...</p>
        ) : suggestions?.length === 0 ? (
          <div className="bg-white p-8 rounded shadow text-center">
            <h2 className="text-xl font-semibold mb-2">No matches found.</h2>
            <p className="text-gray-600">Try adding more ingredients to your inventory!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {suggestions?.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{recipe.title}</h2>
                    <p className="text-sm text-gray-500">Serves {recipe.servings}</p>
                  </div>
                  
                  {/* Match Percentage Badge */}
                  <div className={`px-4 py-2 rounded-full font-bold text-white ${
                    recipe.match_percentage === 100 ? 'bg-green-600' :
                    recipe.match_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {recipe.match_percentage}% Match
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                  <div 
                    className={`h-2.5 rounded-full ${
                      recipe.match_percentage === 100 ? 'bg-green-600' :
                      recipe.match_percentage >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${recipe.match_percentage}%` }}
                  ></div>
                </div>

                {/* Missing Ingredients Section */}
                {recipe.match_percentage < 100 && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <h3 className="text-sm font-bold text-red-800 uppercase mb-2">You are missing:</h3>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {recipe.missing_ingredients.map((ing, idx) => (
                        <li key={idx}>
                          {ing.missing_qty} {ing.unit} {ing.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {recipe.match_percentage === 100 && (
                   <div className="text-green-700 font-medium bg-green-50 p-3 rounded border border-green-200">
                     🎉 You have everything you need to cook this!
                   </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}