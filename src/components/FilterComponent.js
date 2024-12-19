import { Calendar , Clock} from "lucide-react";

const FilterComponent = ({ filterType, setFilterType }) => {
    const filterOptions = [
      { id: 'yesterday', label: 'Yesterday' },
      { id: 'last_week', label: 'Last Week' },
      { id: 'last_month', label: 'Last Month' },
      { id: 'last_year', label: 'Last Year' },
      { id: 'all', label: 'All Time' },
    ];
  
    return (
      <div className="bg-white/70 p-4 rounded-xl shadow-xs mb-4">
        {/* Main Container */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left Side - Selected Period */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
              <Calendar className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-gray-800">
                {filterOptions.find(opt => opt.id === filterType)?.label}
              </span>
            </div>
            
            <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
              <Clock className="h-3 w-3 mr-1" />
              <span>Live updates</span>
            </div>
          </div>
  
          {/* Right Side - Filter Options */}
          <div className="w-full md:w-auto">
            {/* Mobile and Tablet View - Scrollable */}
            <div className="md:hidden overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {filterOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFilterType(option.id)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                      transition duration-200
                      ${filterType === option.id 
                        ? 'bg-yellow-300 text-gray-900' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
  
            {/* Desktop View */}
            <div className="hidden md:flex bg-gray-50 p-1 rounded-xl">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFilterType(option.id)}
                  className={`
                    px-4 py-1.5 rounded-lg text-sm font-medium min-w-[100px]
                    transition duration-200
                    ${filterType === option.id 
                      ? 'bg-yellow-300 text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:bg-white/50'}
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

export default FilterComponent;