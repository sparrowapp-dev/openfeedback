import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Avatar, Dropdown, Button } from '../ui';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ...(user?.isAdmin
      ? [
          { name: 'Boards', href: '/admin/boards', icon: Squares2X2Icon },
          { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
        ]
      : []),
  ];

  const userMenuItems = [
    {
      label: 'Profile',
      icon: <UserCircleIcon className="of-w-4 of-h-4" />,
      onClick: () => navigate('/profile'),
    },
    {
      label: 'Sign out',
      icon: <ArrowLeftOnRectangleIcon className="of-w-4 of-h-4" />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <div className="of-min-h-screen of-bg-gray-50">
      {/* Header */}
      <header className="of-bg-white of-border-b of-border-gray-200 of-sticky of-top-0 of-z-40">
        <div className="of-max-w-7xl of-mx-auto of-px-4 sm:of-px-6 lg:of-px-8">
          <div className="of-flex of-items-center of-justify-between of-h-16">
            {/* Logo & Nav */}
            <div className="of-flex of-items-center of-gap-8">
              {/* Logo */}
              <Link to="/dashboard" className="of-flex of-items-center of-gap-2">
                <div className="of-w-8 of-h-8 of-bg-primary of-rounded-lg of-flex of-items-center of-justify-center">
                  <ChatBubbleLeftRightIcon className="of-w-5 of-h-5 of-text-white" />
                </div>
                <span className="of-text-lg of-font-bold of-text-gray-900">
                  OpenFeedback
                </span>
              </Link>

              {/* Main Nav */}
              <nav className="of-hidden md:of-flex of-items-center of-gap-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={clsx(
                        'of-flex of-items-center of-gap-2 of-px-3 of-py-2 of-rounded-lg of-text-sm of-font-medium of-transition-colors',
                        isActive
                          ? 'of-bg-primary/10 of-text-primary'
                          : 'of-text-gray-600 hover:of-bg-gray-100 hover:of-text-gray-900'
                      )}
                    >
                      <item.icon className="of-w-5 of-h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Menu */}
            <div className="of-flex of-items-center of-gap-4">
              <Dropdown
                trigger={
                  <button className="of-flex of-items-center of-gap-2 of-p-1 of-rounded-lg hover:of-bg-gray-100 of-transition-colors">
                    <Avatar name={user?.name || 'User'} src={user?.avatarURL} size="sm" />
                    <span className="of-hidden sm:of-block of-text-sm of-font-medium of-text-gray-700">
                      {user?.name}
                    </span>
                  </button>
                }
                items={userMenuItems}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="of-max-w-7xl of-mx-auto of-px-4 sm:of-px-6 lg:of-px-8 of-py-8">
        {children}
      </main>
    </div>
  );
}
