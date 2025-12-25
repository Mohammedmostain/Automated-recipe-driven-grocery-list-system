'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  instructions: string;
  ingredients: Ingredient[];
}

export default function RecipeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: recipe, isLoading, error } = useQuery<Recipe>({
    queryKey: ['recipe', id],
    queryFn: async () => (await api.get(`/recipes/${id}`)).data,
    enabled: !!user && !!id
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading recipe...</div>;
  if (error || !recipe) return <div className="p-8 text-center text-red-500">Recipe not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-8 py-6 text-white flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">{recipe.title}</h1>
                <p className="opacity-90 mt-1">Serves {recipe.servings}</p>
            </div>
            <Link 
                href="/" 
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded transition text-sm font-medium"
            >
                &larr; Back
            </Link>
        </div>

        <div className="p-8 grid md:grid-cols-3 gap-8">
            {/* Ingredients Sidebar */}
            <div className="md:col-span-1 bg-gray-50 p-6 rounded-lg border border-gray-100 h-fit">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Ingredients</h2>
                <ul className="space-y-3 text-sm text-gray-700">
                    {recipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="flex justify-between">
                            <span>{ing.name}</span>
                            <span className="font-semibold text-gray-500">{ing.quantity} {ing.unit}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Instructions Main Area */}
            <div className="md:col-span-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Instructions</h2>
                <div className="prose prose-blue text-gray-700 whitespace-pre-line leading-relaxed">
                    {recipe.instructions || "No instructions provided."}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}