
import LoginForm from '@/components/Auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { user } = useAuth();

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-brand-600 mb-2">FaceTrack</h1>
        <p className="text-gray-600">Employee Facial Attendance System</p>
      </div>
      
      <LoginForm />
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>© 2025 FaceTrack. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;
