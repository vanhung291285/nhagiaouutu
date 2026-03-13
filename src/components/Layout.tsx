import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Award, ClipboardList, Settings, BarChart3 } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Trang chủ', icon: BookOpen },
    { path: '/achievements', label: 'Hồ sơ thành tích', icon: Award },
    { path: '/survey', label: 'Khảo sát ý kiến', icon: ClipboardList, highlight: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-700" />
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                Thăm dò dư luận nhà giáo ưu tú
              </h1>
            </div>
            <nav className="hidden md:flex space-x-2 items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                if (item.highlight) {
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all shadow-sm ${
                        isActive 
                          ? 'bg-amber-500 text-white ring-2 ring-amber-300 ring-offset-2 ring-offset-blue-700' 
                          : 'bg-amber-400 text-amber-950 hover:bg-amber-500 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                }
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {/* Mobile menu button could go here */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mb-16 md:mb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'fill-blue-50/50' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-8 mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <div className="text-sm text-slate-400 text-center">
              &copy; {new Date().getFullYear()} Thăm dò dư luận nhà giáo ưu tú Xét tặng Danh hiệu "Nhà giáo Ưu Tú".
            </div>
          </div>
          
          {/* Subtle Admin Link */}
          <div className="absolute right-4 bottom-0 md:right-8">
            <Link 
              to="/admin" 
              className="text-[10px] text-slate-600 hover:text-slate-500 transition-colors opacity-40 hover:opacity-100 flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Quản trị
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile Footer (Simplified) */}
      <footer className="bg-slate-800 text-slate-400 py-6 md:hidden mb-20">
        <div className="px-4 text-center">
          <p className="text-[10px] leading-relaxed">
            &copy; {new Date().getFullYear()} Thăm dò dư luận nhà giáo ưu tú<br/>
            Xét tặng Danh hiệu "Nhà giáo Ưu Tú"
          </p>
          <Link to="/admin" className="inline-flex items-center gap-1 mt-3 text-[10px] opacity-50">
            <Settings className="h-3 w-3" /> Quản trị
          </Link>
        </div>
      </footer>
    </div>
  );
}
