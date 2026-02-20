import React, { useState } from 'react'; // 1. Import useState

const WireframeDashboard = () => {
  // 2. STATE: This is our memory.
  // 'view' is the current value (starts as 'menu').
  // 'setView' is the function we use to change it.
  const [view, setView] = useState<'menu' | 'time-selection'>('menu');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: This is the dynamic part that changes! */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-200 min-h-[400px]">
          
          {/* 3. LOGIC: If view is 'menu', show the Menu. */}
          {view === 'menu' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Play Chess</h2>
              {/* We will build the Menu buttons here in Step 2 */}
              <p>Menu goes here...</p>
              <button onClick={() => setView('time-selection')} className="bg-blue-500 text-white p-2 rounded">
                Test: Go to Time Selection
              </button>
            </div>
          )}

          {/* 4. LOGIC: If view is 'time-selection', show the Time Controls. */}
          {view === 'time-selection' && (
            <div>
              <button onClick={() => setView('menu')} className="text-gray-500 hover:text-black mb-4">
                ← Back
              </button>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Choose Time Control</h2>
              {/* We will build the Time buttons here in Step 3 */}
              <p>Time controls go here...</p>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT COLUMN: This stays the same (Open Games) */}
      <div className="lg:col-span-1 border-2 border-dashed border-blue-300 p-4">
        Right Sidebar (Open Games)
      </div>

    </div>
  );
};

export default WireframeDashboard;