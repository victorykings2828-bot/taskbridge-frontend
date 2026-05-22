import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../../utils/api';

const Layout = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications');
        setUnreadCount(res.data.unreadCount || 0);
      } catch {}
    };
    const initialDelay = setTimeout(fetchUnread, 3000);
    const interval = setInterval(fetchUnread, 30000);
    return () => { clearTimeout(initialDelay); clearInterval(interval); };
  }, []);

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar unreadCount={unreadCount} />
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-5 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
