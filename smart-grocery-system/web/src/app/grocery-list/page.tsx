'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

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
  
  // Local state to track items "checked off" while shopping (visual only)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // 1. Fetch Data
  const { data: recipes } = useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => (await api.get('/recipes')).data,
    enabled: !!user
  });

  const { data: groceryList, isLoading: isListLoading } = useQuery<GroceryListResponse>({
    queryKey: ['grocery-list'],
    queryFn: async () => (await api.get('/grocery')).data,
    enabled: !!user
  });

  // 2. Toggle Single Recipe
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_selected }: { id: string; is_selected: boolean }) => {
      return api.patch(`/recipes/${id}/select`, { is_selected });
    },
    onMutate: async ({ id, is_selected }) => {
      await queryClient.cancelQueries({ queryKey: ['recipes'] });
      const prev = queryClient.getQueryData<Recipe[]>(['recipes']);
      queryClient.setQueryData<Recipe[]>(['recipes'], (old) => 
        old?.map(r => r.id === id ? { ...r, is_selected } : r)
      );
      return { prev };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['grocery-list'] });
    }
  });

  // 3. Clear ALL Selection
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      return api.post('/recipes/clear-selection');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['grocery-list'] });
      setCheckedItems({}); // Reset local checks
    }
  });

  const activeCount = recipes?.filter(r => r.is_selected).length || 0;
  const isEmpty = !groceryList || Object.keys(groceryList).length === 0;

  const toggleItemCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans flex flex-col md:flex-row">
      
      {/* --- SIDEBAR (Recipe Controller) --- */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 flex-shrink-0 md:h-screen md:sticky md:top-0 overflow-y-auto z-10">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center">
              <span className="mr-1">←</span> Dashboard
            </Link>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Your Menu</h2>
            <div className="flex justify-between items-baseline mt-2">
              <p className="text-sm text-gray-500 font-medium">
                {activeCount} {activeCount === 1 ? 'recipe' : 'recipes'} selected
              </p>
              
              {activeCount > 0 && (
                <button 
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearAllMutation.isPending}
                  className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wide disabled:opacity-50"
                >
                  {clearAllMutation.isPending ? 'Clearing...' : 'Clear All'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {recipes?.map(recipe => (
              <label 
                key={recipe.id} 
                className={`group flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  recipe.is_selected 
                    ? 'bg-blue-50 border-blue-500 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-gray-50'
                }`}
              >
                <span className={`text-sm font-medium transition-colors ${
                  recipe.is_selected ? 'text-blue-900' : 'text-gray-600 group-hover:text-gray-900'
                }`}>
                  {recipe.title}
                </span>
                
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    recipe.is_selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}>
                    {recipe.is_selected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>

                <input 
                  type="checkbox"
                  className="hidden"
                  checked={recipe.is_selected}
                  onChange={(e) => toggleMutation.mutate({ 
                    id: recipe.id, 
                    is_selected: e.target.checked 
                  })}
                />
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT (The Grocery List) --- */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <header className="max-w-3xl mx-auto mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Shopping List</h1>
            <p className="text-gray-500 mt-2">Grouped by aisle for faster shopping</p>
          </div>
          {isListLoading && (
            <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </header>

        {isEmpty ? (
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                🥗
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your list is empty</h3>
              <p className="text-gray-500 mb-6">Select recipes from the menu on the left to automatically generate your shopping list.</p>
              <div className="text-sm text-blue-500 font-medium bg-blue-50 inline-block px-4 py-2 rounded-full">
                Waiting for recipes...
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {groceryList && Object.entries(groceryList).map(([aisle, items]) => (
              <div key={aisle} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Aisle Header */}
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 uppercase tracking-wider text-xs">{aisle}</h3>
                  <span className="bg-white text-gray-500 text-xs font-bold px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                    {items.length} items
                  </span>
                </div>

                {/* Items List */}
                <ul className="divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const uniqueKey = `${aisle}-${item.name}-${idx}`;
                    const isChecked = checkedItems[uniqueKey];

                    return (
                      <li 
                        key={uniqueKey} 
                        onClick={() => toggleItemCheck(uniqueKey)}
                        className={`group px-6 py-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50 select-none ${
                            isChecked ? 'bg-gray-50' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Custom Checkbox Circle */}
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isChecked 
                                ? 'bg-green-500 border-green-500 scale-110' 
                                : 'border-gray-300 group-hover:border-blue-400'
                          }`}>
                            {isChecked && (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                          </div>
                          
                          <span className={`font-medium text-lg transition-all duration-300 ${
                            isChecked ? 'text-gray-400 line-through' : 'text-gray-800'
                          }`}>
                            {item.name}
                          </span>
                        </div>

                        <span className={`text-sm font-semibold px-3 py-1 rounded-lg transition-colors ${
                            isChecked 
                                ? 'bg-gray-200 text-gray-400' 
                                : 'bg-blue-50 text-blue-700'
                        }`}>
                          {item.quantity} {item.unit}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            
            {/* End of list decoration */}
            <div className="text-center text-gray-300 text-sm mt-8">
              — End of List —
            </div>
          </div>
        )}
      </main>
    </div>
  );
}