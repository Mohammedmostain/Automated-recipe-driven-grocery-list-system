'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: string;
  unit: string;
}

interface IngredientOption {
  id: string;
  name: string;
  default_unit: string;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [newItemId, setNewItemId] = useState('');

  // 1. Fetch Inventory
  const { data: inventory, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => (await api.get('/inventory')).data
  });

  // 2. Fetch Ingredients (for the 'Add' dropdown)
  const { data: ingredients } = useQuery<IngredientOption[]>({
    queryKey: ['ingredients'],
    queryFn: async () => (await api.get('/ingredients')).data
  });

  // 3. Mutation: Update Quantity
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
      // Find default unit
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

  if (isLoading) return <div className="p-8">Loading inventory...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Kitchen Inventory</h1>
          <Link href="/" className="text-blue-600 hover:underline">Back to Recipes</Link>
        </div>

        {/* Add New Item Section */}
        <div className="bg-white p-4 rounded shadow mb-8 flex gap-4">
          <select 
            className="flex-grow border rounded px-3 py-2 bg-white"
            value={newItemId}
            onChange={(e) => setNewItemId(e.target.value)}
          >
            <option value="">Select an ingredient to add...</option>
            {ingredients?.map(ing => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
          </select>
          <button 
            disabled={!newItemId}
            onClick={() => addMutation.mutate(newItemId)}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Ingredient</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 w-32">Quantity</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 w-24">Unit</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {inventory?.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">Your fridge is empty!</td>
                </tr>
              )}
              {inventory?.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{item.ingredient_name}</td>
                  
                  {/* Editable Quantity */}
                  <td className="py-3 px-4">
                    <input 
                      type="text" 
                      className="border rounded px-2 py-1 w-full text-center focus:ring-2 focus:ring-blue-500 outline-none"
                      defaultValue={item.quantity}
                      onBlur={(e) => {
                        // Only save if value changed
                        if (e.target.value !== item.quantity) {
                          updateMutation.mutate({ 
                            id: item.id, 
                            quantity: e.target.value, 
                            unit: item.unit 
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                    />
                  </td>

                  {/* Editable Unit */}
                  <td className="py-3 px-4">
                     <input 
                      type="text" 
                      className="border rounded px-2 py-1 w-full text-center focus:ring-2 focus:ring-blue-500 outline-none"
                      defaultValue={item.unit}
                      onBlur={(e) => {
                        if (e.target.value !== item.unit) {
                          updateMutation.mutate({ 
                            id: item.id, 
                            quantity: item.quantity, 
                            unit: e.target.value 
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                         if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                    />
                  </td>
                  
                  <td className="py-3 px-4 text-xs text-gray-400">
                    {updateMutation.isPending && "Saving..."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}