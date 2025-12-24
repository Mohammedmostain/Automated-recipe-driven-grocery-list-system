'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface IngredientOption {
  id: string;
  name: string;
  default_unit: string;
}

interface IngredientRow {
  ingredient_id: string; // If selecting existing
  custom_name: string;   // If typing new
  quantity: string;
  unit: string;
  isCustom: boolean;     // Toggle state
}

export default function NewRecipePage() {
  const router = useRouter();
  
  // Form State
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [servings, setServings] = useState(4);
  const [rows, setRows] = useState<IngredientRow[]>([]);
  
  // Data State
  const [availableIngredients, setAvailableIngredients] = useState<IngredientOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/ingredients')
      .then(res => setAvailableIngredients(res.data))
      .catch(err => console.error("Failed to load ingredients", err));
  }, []);

  const addRow = () => {
    setRows([...rows, { ingredient_id: '', custom_name: '', quantity: '', unit: '', isCustom: false }]);
  };

  const removeRow = (index: number) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const updateRow = (index: number, field: keyof IngredientRow, value: any) => {
    const newRows = [...rows];
    // @ts-ignore
    newRows[index][field] = value;

    // Auto-fill unit if selecting existing ingredient
    if (field === 'ingredient_id' && !newRows[index].isCustom) {
      const selected = availableIngredients.find(i => i.id === value);
      if (selected && selected.default_unit) {
        newRows[index].unit = selected.default_unit;
      }
    }
    setRows(newRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Transform rows for API
    const apiIngredients = rows.map(r => {
      if (r.isCustom) {
        return { name: r.custom_name, quantity: r.quantity, unit: r.unit };
      } else {
        return { ingredient_id: r.ingredient_id, quantity: r.quantity, unit: r.unit };
      }
    }).filter(r => (r.ingredient_id || r.name) && r.quantity);

    try {
      await api.post('/recipes', {
        title,
        instructions,
        servings,
        ingredients: apiIngredients
      });
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create New Recipe</h1>
          <Link href="/" className="text-gray-500 hover:text-gray-700">Cancel</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="e.g. Mom's Spaghetti"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
              <input 
                type="number" 
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea 
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border rounded px-3 py-2 h-32 focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="Step 1..."
            />
          </div>

          <hr />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Ingredients</label>
              <button 
                type="button" 
                onClick={addRow}
                className="text-sm text-green-600 font-semibold hover:text-green-800"
              >
                + Add Ingredient
              </button>
            </div>

            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={index} className="flex gap-2 items-center flex-wrap md:flex-nowrap bg-gray-50 p-2 rounded">
                  
                  {/* Toggle Button */}
                  <div className="flex-grow min-w-[200px]">
                    {!row.isCustom ? (
                      <select 
                        value={row.ingredient_id}
                        onChange={(e) => {
                          if (e.target.value === 'CUSTOM_NEW') {
                            updateRow(index, 'isCustom', true);
                          } else {
                            updateRow(index, 'ingredient_id', e.target.value);
                          }
                        }}
                        className="w-full border rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Ingredient...</option>
                        {availableIngredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                        <option value="CUSTOM_NEW" className="font-bold text-blue-600">+ Type Custom Name...</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Enter ingredient name..."
                          value={row.custom_name}
                          onChange={(e) => updateRow(index, 'custom_name', e.target.value)}
                          className="flex-grow border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          autoFocus
                        />
                        <button 
                          type="button"
                          onClick={() => updateRow(index, 'isCustom', false)}
                          className="text-xs text-gray-500 underline"
                        >
                          Back to List
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <input 
                    type="text" 
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                    className="w-20 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Unit */}
                  <input 
                    type="text" 
                    placeholder="Unit"
                    value={row.unit}
                    onChange={(e) => updateRow(index, 'unit', e.target.value)}
                    className="w-20 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Remove Button */}
                  <button 
                    type="button"
                    onClick={() => removeRow(index)}
                    className="text-red-500 hover:text-red-700 px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Recipe'}
          </button>
        </form>
      </div>
    </div>
  );
}