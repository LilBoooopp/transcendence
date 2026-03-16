import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';

interface ProtectedGameRouteProps {
  children: React.ReactNode;
}

const ProtectedGameRoute: React.FC<ProtectedGameRouteProps> = ({ children }) => {

  return <>{children}</>;
};

export default ProtectedGameRoute;