import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const UserLayout = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not a regular user
  React.useEffect(() => {
    if (user?.role !== 'user') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'user') {
    return null; // or a loading spinner
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

UserLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default UserLayout;
