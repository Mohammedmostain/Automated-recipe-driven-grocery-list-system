'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// --- Interfaces ---
interface GroceryItem {
  name: string;
  quantity: string;
  unit: string;
}

interface Recipe {
  id: string;
  title: string;
  is_selected: boolean;
}

type GroceryListResponse = Record<string, GroceryItem[]>;

export default function GroceryListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch Selected Recipes (for the Sidebar)
  const { data: recipes } = useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => (await api.get('/recipes')).data,
    enabled: !!user
  });

  // 2. Fetch Grocery List (Computed)
  const { data: groceryList, isLoading: isListLoading } = useQuery<GroceryListResponse>({
    queryKey: ['grocery-list'],
    queryFn: async () => (await api.get('/grocery')).data,
    enabled: !!user
  });

  // 3. Mutation: Toggle Recipe
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_selected }: { id: string; is_selected: boolean }) => {
      return api.patch(`/recipes/${id}/select`, { is_selected });
    },
    onMutate: async ({ id, is_selected }) => {
      // Optimistic Update for Recipe List
      await queryClient.cancelQueries({ queryKey: ['recipes'] });
      const prevRecipes = queryClient.getQueryData<Recipe[]>(['recipes']);
      
      queryClient.setQueryData<Recipe[]>(['recipes'], (old) => 
        old?.map(r => r.id === id ? { ...r, is_selected } : r)
      );

      return { prevRecipes };
    },
    onSettled: () => {
      // CRITICAL: Invalidate BOTH to force the list to recalculate!
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['grocery-list'] });
    }
  });

  // Filter only selected recipes for the "Active Menu" count
  const activeCount = recipes?.filter(r => r.is_selected).length || 0;
  const isEmpty = !groceryList || Object.keys(groceryList).length === 0;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-black flex flex-col md:flex-row">
      
      {/* --- LEFT SIDEBAR: RECIPE CONTROL --- */}
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-white border-r min-h-[200px] md:min-h-screen p-6">
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h2 className="text-xl font-bold text-gray-800">Menu</h2>
          <p className="text-sm text-gray-500">{activeCount} recipes selected</p>
        </div>

        <div className="space-y-3">
          {recipes?.map(recipe => (
            <label 
              key={recipe.id} 
              className={`flex items-center space-x-3 p-3 rounded cursor-pointer transition ${
                recipe.is_selected ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <input 
                type="checkbox"
                checked={recipe.is_selected}
                onChange={(e) => toggleMutation.mutate({ 
                  id: recipe.id, 
                  is_selected: e.target.checked 
                })}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
              />
              <span className={`text-sm font-medium ${recipe.is_selected ? 'text-green-800' : 'text-gray-600'}`}>
                {recipe.title}
              </span>
            </label>
          ))}
        </div>
      </aside>

      {/* --- RIGHT SIDE: SHOPPING LIST --- */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Shopping List</h1>
          {isListLoading && <span className="text-sm text-gray-400 animate-pulse">Updating...</span>}
        </header>

        {isEmpty ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
            <p className="text-xl text-gray-400 mb-2">Your list is empty.</p>
            <p className="text-gray-500 text-sm">Select recipes on the left to generate a list.</p>
          </div>
        ) : (
          <div className="masonry-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Render Aisles */}
            {groceryList && Object.entries(groceryList).map(([aisle, items]) => (
              <div key={aisle} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden self-start">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">{aisle}</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <li key={idx} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 group">
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 opacity-50 hover:opacity-100" />
                        <span className="font-medium text-gray-800 group-hover:text-black">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}