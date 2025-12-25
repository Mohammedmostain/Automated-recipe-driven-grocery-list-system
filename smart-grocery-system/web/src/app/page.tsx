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

  // 1. Fetch Recipes using React Query
  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => (await api.get('/recipes')).data,
    enabled: !!user // Only fetch if user is logged in
  });

  // 2. Optimistic Mutation for Toggling Selection
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_selected }: { id: string; is_selected: boolean }) => {
      return api.patch(`/recipes/${id}/select`, { is_selected });
    },
    // When the mutation starts:
    onMutate: async ({ id, is_selected }) => {
      // A. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['recipes'] });

      // B. Snapshot the previous value
      const previousRecipes = queryClient.getQueryData<Recipe[]>(['recipes']);

      // C. Optimistically update to the new value
      queryClient.setQueryData<Recipe[]>(['recipes'], (old) => {
        if (!old) return [];
        return old.map((recipe) =>
          recipe.id === id ? { ...recipe, is_selected } : recipe
        );
      });

      // D. Return a context object with the snapshotted value
      return { previousRecipes };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['recipes'], context?.previousRecipes);
    },
    // Always refetch after error or success to ensure sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Recipes</h1>
        <div className="space-x-4">
          <Link 
            href="/inventory" 
            className="text-blue-600 font-medium hover:underline"
          >
            Manage Inventory
          </Link>
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
              className={`p-6 rounded-lg shadow transition border-2 ${
                recipe.is_selected ? 'bg-green-50 border-green-500' : 'bg-white border-transparent hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold">{recipe.title}</h2>
                
                {/* Checkbox Toggle */}
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={recipe.is_selected}
                    onChange={(e) => toggleMutation.mutate({ 
                      id: recipe.id, 
                      is_selected: e.target.checked 
                    })}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-600">
                    Cook this
                  </span>
                </label>
              </div>

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