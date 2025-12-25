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
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['recipes'], context?.previousRecipes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <header className="flex flex-col xl:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">My Recipes</h1>
        
        <div className="flex flex-wrap items-center gap-4 justify-center">
          <Link 
            href="/what-can-i-cook" 
            className="bg-purple-600 text-white px-5 py-2 rounded-full font-semibold shadow hover:bg-purple-700 transition flex items-center gap-2"
          >
            🍳 What Can I Cook?
          </Link>

          <Link 
            href="/grocery-list" 
            className="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold shadow hover:bg-blue-700 transition flex items-center gap-2"
          >
            🛒 View Shopping List
          </Link>

          <Link 
            href="/inventory" 
            className="text-gray-600 font-medium hover:text-gray-900 hover:underline px-2"
          >
            My Fridge
          </Link>
          <Link 
            href="/recipes/new" 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            + Add Recipe
          </Link>
          <button 
            onClick={logout} 
            className="text-red-500 hover:text-red-700 font-medium ml-2"
          >
            Logout
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="text-center text-gray-500">Loading your recipes...</p>
      ) : recipes?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow">
          <p className="text-xl text-gray-600 mb-4">You haven't added any recipes yet.</p>
          <Link href="/recipes/new" className="text-blue-500 hover:underline">Create your first one now!</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes?.map((recipe) => (
            <div 
              key={recipe.id} 
              className={`relative rounded-lg shadow transition border-2 group hover:shadow-lg ${
                recipe.is_selected ? 'bg-green-50 border-green-500' : 'bg-white border-transparent'
              }`}
            >
              {/* 1. The Checkbox Area 
                 Positioned absolutely so it sits on top of the card but is separate from the Link.
                 z-10 ensures it catches clicks before the link does.
              */}
              <div className="absolute top-4 right-4 z-10 bg-white/50 p-1 rounded backdrop-blur-sm hover:bg-white transition">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {recipe.is_selected ? 'Cook' : 'Select'}
                  </span>
                  <input 
                    type="checkbox"
                    checked={recipe.is_selected}
                    onChange={(e) => toggleMutation.mutate({ 
                      id: recipe.id, 
                      is_selected: e.target.checked 
                    })}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300 shadow-sm"
                  />
                </label>
              </div>

              {/* 2. The Clickable Card Body 
                 Everything here links to the detail page.
              */}
              <Link href={`/recipes/${recipe.id}`} className="block p-6 h-full">
                <div className="pr-16"> {/* Padding right to avoid overlap with checkbox */}
                  <h2 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                    {recipe.title}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">Serves: {recipe.servings}</p>
                </div>
                
                <ul className="text-sm space-y-1 mt-4 text-gray-600">
                  {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                    <li key={idx} className="truncate">
                      • {ing.quantity} {ing.unit} {ing.name}
                    </li>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <li className="text-gray-400 text-xs italic">+ {recipe.ingredients.length - 3} more</li>
                  )}
                </ul>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}