'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// --- Types matching YOUR existing Backend ---
interface InventoryItem {
  id: string;
  ingredient_id: string;
  ingredient_name: string; // <--- Flat string (No nested object)
  quantity: string;
  unit: string;
}

interface IngredientOption {
  id: string;
  name: string;
  default_unit: string;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for the "Add" form
  const [newItemId, setNewItemId] = useState('');

  // 1. Fetch Inventory
  const { data: inventory, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => (await api.get('/inventory')).data,
    enabled: !!user
  });

  // 2. Fetch Ingredients (for dropdown)
  const { data: ingredients } = useQuery<IngredientOption[]>({
    queryKey: ['ingredients'],
    queryFn: async () => (await api.get('/ingredients')).data,
    enabled: !!user
  });

  // 3. Mutation: Update Quantity/Unit
  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity, unit }: { id: string; quantity: string; unit: string }) => {
      return api.put(`/inventory/${id}`, { quantity, unit });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  // 4. Mutation: Add New Item
  const addMutation = useMutation({
    mutationFn: async (ingredient_id: string) => {
      const ing = ingredients?.find(i => i.id === ingredient_id);
      return api.post('/inventory', { 
        ingredient_id, 
        quantity: "1", 
        unit: ing?.default_unit || "unit" 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setNewItemId('');
    }
  });

  // 5. Mutation: Delete Item (Standard API call)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Fridge</h1>
            <p className="text-gray-500">Track what you already have at home</p>
          </div>
          <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm transition">
            ← Back to Cookbook
          </Link>
        </div>

        {/* --- "Quick Add" Card --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Add Item</h2>
          <div className="flex gap-3">
             <div className="relative flex-grow">
                <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition"
                    value={newItemId}
                    onChange={(e) => setNewItemId(e.target.value)}
                >
                    <option value="">Select an ingredient...</option>
                    {ingredients?.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                </select>
                {/* Custom arrow icon for select */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
             </div>
            
            <button 
              disabled={!newItemId || addMutation.isPending}
              onClick={() => addMutation.mutate(newItemId)}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {addMutation.isPending ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </div>

        {/* --- Inventory List --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Stock</h3>
                <span className="text-xs font-semibold bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">
                    {inventory?.length || 0} items
                </span>
            </div>
          
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">Loading your fridge...</div>
          ) : inventory?.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <div className="text-4xl mb-3">🧊</div>
              <p>Your fridge is empty.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {inventory?.map((item) => (
                <li key={item.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-gray-50 transition gap-4">
                  
                  {/* Left: Avatar & Name */}
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-lg font-bold shadow-sm">
                        {/* Use item.ingredient_name safely */}
                        {(item.ingredient_name || "?").charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <p className="font-bold text-gray-900">{item.ingredient_name}</p>
                        {/* We don't have aisle in this data model, so we omit it or default it */}
                     </div>
                  </div>

                  {/* Right: Editable Controls */}
                  <div className="flex items-center gap-3 w-full sm:w-auto bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-gray-100">
                    
                    {/* Quantity Input */}
                    <input 
                        type="text" 
                        className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={item.quantity}
                        onBlur={(e) => {
                            if (e.target.value !== item.quantity) {
                                updateMutation.mutate({ id: item.id, quantity: e.target.value, unit: item.unit });
                            }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    />

                    {/* Unit Input */}
                    <input 
                        type="text" 
                        className="w-20 p-2 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={item.unit}
                        onBlur={(e) => {
                            if (e.target.value !== item.unit) {
                                updateMutation.mutate({ id: item.id, quantity: item.quantity, unit: e.target.value });
                            }
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    />

                    {/* Delete Button */}
                    <button 
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="ml-2 w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                      title="Remove Item"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}