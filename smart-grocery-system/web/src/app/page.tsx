'use client';

import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  is_selected: boolean;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => (await api.get('/recipes')).data,
    enabled: !!user 
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_selected }: { id: string; is_selected: boolean }) => {
      return api.patch(`/recipes/${id}/select`, { is_selected });
    },
    onMutate: async ({ id, is_selected }) => {
      await queryClient.cancelQueries({ queryKey: ['recipes'] });
      const previousRecipes = queryClient.getQueryData<Recipe[]>(['recipes']);
      queryClient.setQueryData<Recipe[]>(['recipes'], (old) => {
        if (!old) return [];
        return old.map((recipe) =>
          recipe.id === id ? { ...recipe, is_selected } : recipe
        );
      });
      return { previousRecipes };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      {/* --- HEADER --- */}
      <header className="max-w-6xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Cookbook</h1>
            <p className="text-gray-500 mt-1">Select recipes to build your shopping list</p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
             <Link 
              href="/what-can-i-cook" 
              className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-200 transition shadow-sm"
            >
              🍳 Magic Suggest
            </Link>
            
            <Link 
              href="/grocery-list" 
              className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              🛒 Shopping List
            </Link>

            <Link 
              href="/inventory" 
              className="bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
            >
              My Fridge
            </Link>
             <button 
              onClick={logout} 
              className="text-gray-400 hover:text-red-500 font-medium text-sm px-3"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* --- CONTENT --- */}
      <main className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="text-center py-20">
             <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-gray-400">Opening cookbook...</p>
          </div>
        ) : recipes?.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">📖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Empty Cookbook</h3>
            <p className="text-gray-500 mb-6">You haven't added any recipes yet.</p>
            <Link href="/recipes/new" className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition">
              Create First Recipe
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-6">
                 <Link 
                  href="/recipes/new" 
                  className="bg-white text-green-600 border border-green-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-50 transition shadow-sm flex items-center gap-2"
                >
                  + New Recipe
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes?.map((recipe) => (
                <div 
                  key={recipe.id} 
                  className={`group relative bg-white rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-md ${
                    recipe.is_selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
                  }`}
                >
                  {/* Selection Checkbox (Floating) */}
                  <div className="absolute top-4 right-4 z-20">
                     <label className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all shadow-sm ${
                        recipe.is_selected ? 'bg-blue-500 text-white' : 'bg-white text-gray-300 border border-gray-200 hover:border-blue-300'
                     }`}>
                        <input 
                            type="checkbox"
                            checked={recipe.is_selected}
                            onChange={(e) => toggleMutation.mutate({ 
                              id: recipe.id, 
                              is_selected: e.target.checked 
                            })}
                            className="hidden"
                        />
                        {recipe.is_selected ? (
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                           <span className="text-xl font-bold leading-none mb-1">+</span>
                        )}
                     </label>
                  </div>

                  {/* Clickable Card Body */}
                  <Link href={`/recipes/${recipe.id}`} className="block p-6 h-full">
                    <div className="pr-12">
                      <h2 className={`text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors ${
                          recipe.is_selected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {recipe.title}
                      </h2>
                      <p className="text-sm text-gray-500 font-medium bg-gray-100 inline-block px-2 py-1 rounded-md">
                        {recipe.servings} Servings
                      </p>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-50">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ingredients</p>
                        <ul className="space-y-1">
                        {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex justify-between">
                                <span className="truncate pr-2">{ing.name}</span>
                                <span className="text-gray-400 text-xs">{ing.quantity} {ing.unit}</span>
                            </li>
                        ))}
                        </ul>
                         {recipe.ingredients.length > 3 && (
                            <p className="text-xs text-blue-500 font-medium mt-2">+ {recipe.ingredients.length - 3} more items</p>
                        )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}