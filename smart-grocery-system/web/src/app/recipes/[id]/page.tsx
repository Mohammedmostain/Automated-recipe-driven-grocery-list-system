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

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div></div>;
  if (error || !recipe) return <div className="p-8 text-center text-red-500">Recipe not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10 font-sans text-gray-900 flex justify-center">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Navbar inside the card */}
        <div className="bg-white border-b border-gray-100 px-8 py-6 flex justify-between items-center sticky top-0 z-10">
             <Link 
                href="/" 
                className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1"
            >
                ← Back to Menu
            </Link>
             <div className="text-xs font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full uppercase tracking-wider">
                Recipe
            </div>
        </div>

        {/* Hero Section */}
        <div className="px-8 md:px-12 py-10 bg-gradient-to-br from-blue-50 to-white">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">{recipe.title}</h1>
            <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2 text-gray-600 font-medium">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <span>{recipe.servings} Servings</span>
                 </div>
                 {/* Placeholder for future "Time" field */}
                 <div className="flex items-center gap-2 text-gray-600 font-medium">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>25 mins</span>
                 </div>
            </div>
        </div>

        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Ingredients Sidebar */}
            <div className="md:col-span-1 bg-gray-50/50 p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    Ingredients
                </h2>
                <ul className="space-y-4">
                    {recipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm group">
                            <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{ing.name}</span>
                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded ml-2 whitespace-nowrap">{ing.quantity} {ing.unit}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Instructions Main Area */}
            <div className="md:col-span-2 p-8 md:p-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Preparation</h2>
                <div className="prose prose-blue text-gray-600 leading-8 whitespace-pre-line">
                    {recipe.instructions ? recipe.instructions : (
                        <p className="italic text-gray-400">No instructions have been written for this recipe yet.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}