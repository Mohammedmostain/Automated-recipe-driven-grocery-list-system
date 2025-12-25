'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';

// Types matches Backend Schema
interface RecipeIngredientInput {
  ingredient_id?: string; // Optional if creating new
  name: string;           // Required for display & creation
  quantity: string;
  unit: string;
}

interface RecipeCreate {
  title: string;
  servings: number;
  instructions: string;
  ingredients: RecipeIngredientInput[];
}

interface IngredientOption {
  id: string;
  name: string;
  default_unit: string;
}

export default function NewRecipePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- Form State ---
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState(4);
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredientInput[]>([]);

  // --- Ingredient Input State ---
  const [ingName, setIngName] = useState('');
  const [ingQty, setIngQty] = useState('');
  const [ingUnit, setIngUnit] = useState('');

  // 1. Fetch Existing Ingredients (for Autocomplete/Dropdown)
  const { data: existingIngredients } = useQuery<IngredientOption[]>({
    queryKey: ['ingredients'],
    queryFn: async () => (await api.get('/ingredients')).data,
  });

  // 2. Create Mutation
  const createMutation = useMutation({
    mutationFn: async (newRecipe: RecipeCreate) => {
      return api.post('/recipes', newRecipe);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      router.push('/'); // Go back to dashboard
    },
  });

  // Helper: Add Ingredient to Local List
  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName || !ingQty) return;

    // Check if selected name matches an existing ID
    const match = existingIngredients?.find(
      (i) => i.name.toLowerCase() === ingName.toLowerCase()
    );

    const newIng: RecipeIngredientInput = {
      ingredient_id: match?.id, // If match found, use ID
      name: match?.name || ingName, // Proper casing if matched, else user input
      quantity: ingQty,
      unit: ingUnit || match?.default_unit || '',
    };

    setIngredients([...ingredients, newIng]);
    
    // Reset inputs
    setIngName('');
    setIngQty('');
    setIngUnit('');
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      servings,
      instructions,
      ingredients,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans text-gray-900 flex justify-center">
      <div className="max-w-3xl w-full">
        
        {/* --- Header --- */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/" 
            className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
          >
            ← Cancel
          </Link>
          <h1 className="text-xl font-bold text-gray-900">New Recipe</h1>
          <div className="w-16"></div> {/* Spacer for alignment */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* --- Card 1: Basic Info --- */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              Recipe Details
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Recipe Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Grandma's Lasagna"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Servings</label>
                <div className="flex items-center gap-4">
                  <button 
                    type="button" 
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-gray-900 w-8 text-center">{servings}</span>
                  <button 
                    type="button" 
                    onClick={() => setServings(servings + 1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-2">people</span>
                </div>
              </div>
            </div>
          </div>

          {/* --- Card 2: Ingredients --- */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Ingredients
            </h2>

            {/* Ingredient Adder Row */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6 relative">
                    <input
                      type="text"
                      list="ingredient-options"
                      value={ingName}
                      onChange={(e) => setIngName(e.target.value)}
                      placeholder="Ingredient (e.g. Flour)"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <datalist id="ingredient-options">
                      {existingIngredients?.map(ing => (
                        <option key={ing.id} value={ing.name} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div className="md:col-span-3">
                     <input
                      type="text"
                      value={ingQty}
                      onChange={(e) => setIngQty(e.target.value)}
                      placeholder="Qty (e.g. 2)"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="md:col-span-3">
                     <input
                      type="text"
                      value={ingUnit}
                      onChange={(e) => setIngUnit(e.target.value)}
                      placeholder="Unit (e.g. cups)"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
               </div>
               <button 
                 type="button" // Prevent submitting the whole form
                 onClick={handleAddIngredient}
                 disabled={!ingName || !ingQty}
                 className="w-full mt-3 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 + Add Ingredient
               </button>
            </div>

            {/* List of Added Ingredients */}
            {ingredients.length === 0 ? (
               <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                 No ingredients added yet.
               </div>
            ) : (
              <ul className="space-y-2">
                {ingredients.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-white p-3 border border-gray-100 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-gray-800">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600 font-semibold">
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeIngredient(idx)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --- Card 3: Instructions --- */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
              Instructions
            </h2>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Step 1: Preheat the oven..."
              rows={6}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition leading-relaxed resize-none"
            />
          </div>

          {/* --- Submit Button --- */}
          <div className="pt-4 pb-20">
             <button
               type="submit"
               disabled={createMutation.isPending || ingredients.length === 0 || !title}
               className="w-full bg-gray-900 text-white font-bold text-lg py-4 rounded-2xl shadow-xl hover:bg-black transition transform hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0"
             >
               {createMutation.isPending ? 'Saving Recipe...' : 'Save Recipe'}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}