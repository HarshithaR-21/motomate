import { Menu, Bell, RefreshCw } from 'lucide-react';

const WorkerHeader = ({ onMenuClick, title, subtitle, onRefresh, loading }) => (
  <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Menu size={20} />
      </button>
      <div>
        <h1 className="text-gray-900 font-bold text-base sm:text-lg leading-tight">{title}</h1>
        {subtitle && <p className="text-gray-400 text-xs">{subtitle}</p>}
      </div>
    </div>

    <div className="flex items-center gap-2">
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-green-50 hover:text-green-600 border border-gray-200 hover:border-green-200 transition-all"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      )}
      <button className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 border border-gray-200 transition-all relative">
        <Bell size={15} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
      </button>
    </div>
  </header>
);

export default WorkerHeader;
