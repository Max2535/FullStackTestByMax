import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function Login() {
  const handleLoginSuccess = (response) => {
    console.log(response);
    // ส่ง Token ไปยัง Backend เพื่อยืนยันและเก็บข้อมูลผู้ใช้
  };

  const handleLoginFailure = (error) => {
    console.error('Login Failed:', error);
  };

  return (
    <GoogleOAuthProvider clientId="219049469149-88g6l9orerd1ucthahjnj05pf1vjgebv.apps.googleusercontent.com">
      <div>
        <h1>Login to Tic-Tac-Toe</h1>
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={handleLoginFailure}
        />
      </div>
    </GoogleOAuthProvider>
  );
}

export default Login;
