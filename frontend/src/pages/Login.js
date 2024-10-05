import React from 'react';
import { useDispatch } from 'react-redux';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { setToken, setUser } from '../slices/authSlice';
import { json, useNavigate } from 'react-router-dom';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLoginSuccess = (credentialResponse) => {
    const googleToken = credentialResponse.credential;

    // Dispatch token ไปที่ Redux store
    dispatch(setToken(googleToken));

    // Fetch user info or call API
    const url = `${process.env.REACT_APP_API_URL}/api/auth/google`;
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: googleToken }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Dispatch user info ไปที่ Redux store
        dispatch(setUser(data.user));
        console.log('Login successful, user data:', data);
        navigate('/dashboard');  // หลังจากล็อกอินเสร็จแล้วให้ไปหน้า dashboard
      })
      .catch((error) => {
        console.error('Login failed:', error);
        alert(json.stringify(error));
      });
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Login with Google</h1>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={(error) => console.error('Login Failed:', error)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
