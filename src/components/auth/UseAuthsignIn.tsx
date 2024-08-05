import axios from 'axios';
import { useSignIn } from 'react-auth-kit';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { API_URL, HTTP_PREFIX } from '../../helper/Constants';

const useAuthSignIn = () => {
  const signIn = useSignIn();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitSignIn = async (formData) => {
    setIsLoading(true);

    try {
      const res = await axios.post(`http${HTTP_PREFIX}://${API_URL}/login`, {
        email: formData.email,
        password: formData.password
      });

      setIsLoading(false);

      if (res.status === 200 && signIn({
        token: res.data.access_token,
        expiresIn: 3600 * 48,
        tokenType: "Bearer",
        authState: {
          email: res.data.email,
          token: res.data.access_token,
        }
      })) {
        // Clear local storage items
        const itemsToRemove = [
          'bidInfo', 'backgroundInfo', 'response', 'inputText', 
          'editorState', 'messages', 'chatResponseMessages', 'bidState'
        ];
        itemsToRemove.forEach(item => localStorage.removeItem(item));

        navigate('/dashboard');
        return { success: true, message: 'Log in successful!' };
      } else {
        setError('Log in unsuccessful');
        return { success: false, message: 'Log in unsuccessful' };
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.detail || err.message || 'An error occurred. Please try again.');
      return { success: false, message: err.response?.data?.detail || err.message || 'An error occurred. Please try again.' };
    }
  };

  return {
    submitSignIn,
    isLoading,
    error,
  };
};

export default useAuthSignIn;