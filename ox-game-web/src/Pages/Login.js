// Login.js
import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { setToken, setUser } from '../slices/authSlice';

const Login = () => {
  const dispatch = useDispatch();

  const handleLoginSuccess = (credentialResponse) => {
    const googleToken = credentialResponse.credential;

    // Dispatch token ไปที่ Redux store
    dispatch(setToken(googleToken));

    // Fetch user info or call API
    var url = `${process.env.REACT_APP_API_URL}/api/auth/google`;
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
    })
    .catch((error) => {
      console.error('Login failed:', error);
    });
  };


  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div>
        <h1>Login with Google</h1>
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={(error) => console.error('Login Failed:', error)}
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
