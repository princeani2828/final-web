import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './forgetpassword.css';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (isSuccess) {
      timer = setTimeout(() => {
        navigate('/login');
      }, 4000); // 4 seconds delay
    }
    return () => clearTimeout(timer);
  }, [isSuccess, navigate]);

  useEffect(() => {
    let countdownTimer;
    if (isSuccess && countdown > 0) {
      countdownTimer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(countdownTimer);
  }, [isSuccess, countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Please check your inbox.');
      setError('');
      setIsSuccess(true);
      setCountdown(4);
    } catch (error) {
      setError(error.message);
      setMessage('');
      setIsSuccess(false);
    }
  };

  return (
    <div className="forget-password-container">
      <div className="forget-password-card">
        <div>
          <h2 className="forget-password-title">
            Reset your password
          </h2>
          <p className="forget-password-subtitle">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>
        <form className="forget-password-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="forget-password-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {message && (
            <div className="forget-password-message forget-password-success">
              {message}
              {isSuccess && (
                <p className="countdown-message">
                  Redirecting to login page in <span className="countdown-timer">{countdown}</span> seconds...
                </p>
              )}
            </div>
          )}
          {error && (
            <div className="forget-password-message forget-password-error">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="forget-password-button"
            >
              Send reset link
            </button>
          </div>

          <div className="forget-password-back-link">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="forget-password-back-button"
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgetPassword;
