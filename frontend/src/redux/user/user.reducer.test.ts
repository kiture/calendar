import { describe, it, expect } from 'vitest';
import { userSlice } from './user.reducer';
import { loginUser, fetchAllUsers, fetchAllRoles } from './user.thunks';
import { initialState } from './user.model';
import type { UserDto } from '../../types/UserDto';
import type { RoleDto } from '../../types/RoleDto';
import type { UserState } from './user.model';

describe('user reducer', () => {
  const mockDate = new Date('2024-01-01T00:00:00.000Z');

  const mockUser = {
    user_id: '1',
    email: 'test@test.com',
    login: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    role_id: '1',
    created_at: mockDate,
    updated_at: mockDate,
  };

  const mockState = {
    user: mockUser,
    accessToken: 'test-token',
    roles: [{ role_id: '1', role_name: 'USER' }],
    users: [mockUser],
  } as UserState;

  it('should handle initial state', () => {
    expect(userSlice.reducer(undefined, { type: 'unknown' })).toEqual(
      initialState
    );
  });

  // Test synchronous actions
  describe('logoutUser', () => {
    it('should clear user data and access token', () => {
      const state = {
        ...mockState,
        user: mockUser,
        accessToken: 'token123',
      } as UserState;

      const expectedState = {
        ...state,
        user: null,
        accessToken: null,
      };

      expect(userSlice.reducer(state, userSlice.actions.logoutUser())).toEqual(
        expectedState
      );
    });
  });

  // Test async actions
  describe('loginUser', () => {
    it('should set loading state when pending', () => {
      const state = {
        ...mockState,
        user: mockUser,
        accessToken: 'token123',
      } as UserState;

      expect(
        userSlice.reducer(state, { type: loginUser.pending.type })
      ).toEqual({
        ...state,
        user: null,
        accessToken: null,
      });
    });

    it('should update state with user data when fulfilled', () => {
      expect(
        userSlice.reducer(mockState, {
          type: loginUser.fulfilled.type,
          payload: { user: mockUser, accessToken: 'token123' },
        })
      ).toEqual({
        ...mockState,
        user: mockUser,
        accessToken: 'token123',
      });
    });

    it('should clear user data when rejected', () => {
      const state = {
        ...mockState,
        user: mockUser,
        accessToken: 'token123',
      } as UserState;

      expect(
        userSlice.reducer(state, { type: loginUser.rejected.type })
      ).toEqual({
        ...state,
        user: null,
        accessToken: null,
      });
    });
  });

  describe('fetchAllUsers', () => {
    it('should update users list when fulfilled', () => {
      const mockUsers: UserDto[] = [
        {
          user_id: '123',
          email: 'test1@example.com',
          login: 'testuser1',
          first_name: 'Test',
          last_name: 'User1',
          role_id: '456',
          created_at: mockDate,
          updated_at: mockDate,
        },
        {
          user_id: '124',
          email: 'test2@example.com',
          login: 'testuser2',
          first_name: 'Test',
          last_name: 'User2',
          role_id: '456',
          created_at: mockDate,
          updated_at: mockDate,
        },
      ];

      expect(
        userSlice.reducer(mockState, {
          type: fetchAllUsers.fulfilled.type,
          payload: { users: mockUsers, total_count: mockUsers.length },
        })
      ).toEqual({
        ...mockState,
        users: mockUsers,
      });
    });

    it('should preserve existing state when fulfilled with empty list', () => {
      const previousState = {
        ...mockState,
        users: [
          {
            user_id: '123',
            email: 'old@example.com',
            login: 'olduser',
            first_name: 'Old',
            last_name: 'User',
            role_id: '456',
            created_at: mockDate,
            updated_at: mockDate,
          },
        ],
        roles: [],
      } as UserState;

      expect(
        userSlice.reducer(previousState, {
          type: fetchAllUsers.fulfilled.type,
          payload: { users: [], total_count: 0 },
        })
      ).toEqual({
        ...previousState,
        users: [],
      });
    });
  });

  describe('fetchAllRoles', () => {
    it('should update roles list when fulfilled', () => {
      const mockRoles: RoleDto[] = [
        {
          role_id: '456',
          role_name: 'Admin',
        },
        {
          role_id: '457',
          role_name: 'User',
        },
      ];

      expect(
        userSlice.reducer(mockState, {
          type: fetchAllRoles.fulfilled.type,
          payload: mockRoles,
        })
      ).toEqual({
        ...mockState,
        roles: mockRoles,
      });
    });

    it('should preserve existing state when fulfilled with empty list', () => {
      const previousState = {
        ...mockState,
        roles: [{ role_id: '456', role_name: 'OLD_ROLE' }],
      } as UserState;

      const action = fetchAllRoles.fulfilled([], 'requestId');

      expect(userSlice.reducer(previousState, action)).toEqual({
        ...previousState,
        roles: [],
      });
    });
  });

  // Test edge cases
  describe('edge cases', () => {
    it('should handle undefined user in login response', () => {
      const action = loginUser.fulfilled(
        {
          user: undefined,
          accessToken: 'test-token',
        },
        'requestId',
        { email: 'test@example.com', password: 'password' }
      );

      expect(userSlice.reducer(mockState, action)).toEqual({
        ...mockState,
        user: undefined,
        accessToken: 'test-token',
      });
    });

    it('should handle null access token in login response', () => {
      const testUser = {
        user_id: '123',
        email: 'test@example.com',
        login: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        role_id: '456',
        created_at: mockDate,
        updated_at: mockDate,
      };

      const action = loginUser.fulfilled(
        {
          user: testUser,
          accessToken: null,
        },
        'requestId',
        { email: 'test@example.com', password: 'password' }
      );

      expect(userSlice.reducer(mockState, action)).toEqual({
        ...mockState,
        user: testUser,
        accessToken: null,
      });
    });

    it('should maintain other state properties when updating users', () => {
      const previousState = {
        ...mockState,
        user: {
          user_id: '123',
          email: 'test@example.com',
          login: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          role_id: '456',
          created_at: mockDate,
          updated_at: mockDate,
        },
        accessToken: 'token123',
        roles: [{ role_id: '456', role_name: 'ADMIN' }],
      } as UserState;

      const mockUsers = [
        {
          user_id: '124',
          email: 'new@example.com',
          login: 'newuser',
          first_name: 'New',
          last_name: 'User',
          role_id: '456',
          created_at: mockDate,
          updated_at: mockDate,
        },
      ];

      const action = fetchAllUsers.fulfilled(
        {
          users: mockUsers,
          total_count: mockUsers.length,
        },
        'requestId'
      );

      expect(userSlice.reducer(previousState, action)).toEqual({
        ...previousState,
        users: mockUsers,
      });
    });
  });

  it('should handle pending actions', () => {
    const state = userSlice.reducer(mockState, {
      type: loginUser.pending.type,
    });
    expect(state).toEqual({
      ...mockState,
      user: null,
      accessToken: null,
    });
  });

  it('should handle rejected actions', () => {
    const error = 'Test error';
    const action = { type: loginUser.rejected.type, error: { message: error } };
    const state = userSlice.reducer(mockState, action);

    expect(state).toEqual({
      ...mockState,
      user: null,
      accessToken: null,
    });
  });
});
