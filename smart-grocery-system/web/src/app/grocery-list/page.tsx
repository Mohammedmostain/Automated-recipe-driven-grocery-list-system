'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface GroceryItem {
  name: string;
  quantity: string;
  unit: string;
}

// The API returns { "Dairy": [Item, Item], "Produce": [Item] }
type GroceryListResponse = Record<string, GroceryItem[]>;

export default function GroceryListPage() {
  const { user } = useAuth();
  
  const { data: groceryList, isLoading, error } = useQuery<GroceryListResponse>({
    queryKey: ['grocery-list'],
    queryFn: async () => (await api.get('/grocery')).data,
    enabled: !!user
  });

  if (isLoading) return <div className="p-8">Calculating your list...</div>;

  const isEmpty = !groceryList || Object.keys(groceryList).length === 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Shopping List</h1>
          <div className="space-x-4">
            <Link href="/" className="text-blue-600 hover:underline">Back to Dashboard</Link>
          </div>
        </div>

        {isEmpty ? (
          <div className="bg-white p-8 rounded shadow text-center">
            <h2 className="text-xl font-semibold mb-2">Your list is empty!</h2>
            <p className="text-gray-600 mb-4">
              Either you have everything you need in your inventory, 
              or you haven't selected any recipes to cook yet.
            </p>
            <Link href="/" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Select Recipes
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groceryList).map(([aisle, items]) => (
              <div key={aisle} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b">
                  <h3 className="font-bold text-gray-700">{aisle}</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <li key={idx} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-sm">
                        {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}