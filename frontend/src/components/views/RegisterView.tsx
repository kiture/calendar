import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../../redux/user/user.thunks';
import { setAppError } from '../../redux/app/app.reducer';

export function RegisterView() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      dispatch(setAppError('Passwords do not match'));
      return;
    }

    try {
      await dispatch(
        createUser({
          email,
          password,
          login: email, // Using email as login
          first_name: firstName,
          last_name: lastName,
        })
      ).unwrap();
      navigate('/auth/login');
    } catch (error) {
      // Error will be handled by the thunk
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Register</h2>
        <Input
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Last Name"
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <Input
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm Password"
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">
          Register
        </Button>
      </form>
      <Button
        type="button"
        className="w-full"
        onClick={() => navigate('/auth/login')}
      >
        Back to Login
      </Button>
    </div>
  );
}
