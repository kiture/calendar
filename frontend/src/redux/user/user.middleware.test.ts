import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Middleware, MiddlewareAPI, Dispatch } from '@reduxjs/toolkit';
import { loginUser, fetchAllRoles, fetchAllUsers } from './user.thunks';
import { userListenerMiddleware } from './user.middleware';
import { selectIsLoggedIn, selectUserIsAdmin } from './user.selectors';
import type { RootState } from '../store';

// Mock selectors
vi.mock('./user.selectors');

describe('User Middleware', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let getState: ReturnType<typeof vi.fn>;
  let next: ReturnType<typeof vi.fn>;
  let middleware: Middleware;

  beforeEach(() => {
    vi.clearAllMocks();

    dispatch = vi.fn((action) => action);
    getState = vi.fn();
    next = vi.fn();
    middleware = userListenerMiddleware.middleware;

    // Setup mock state
    const mockState = {
      app: {},
      user: {},
      group: {},
      events: {},
    } as RootState;
    getState.mockReturnValue(mockState);

    (selectIsLoggedIn as unknown as ReturnType<typeof vi.fn>).mockReset();
    (selectUserIsAdmin as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  describe('loginUser.fulfilled listener', () => {
    it('powinien wywołać fetchAllRoles gdy użytkownik jest zalogowany i jest adminem', async () => {
      // Arrange
      (selectIsLoggedIn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        true
      );
      (
        selectUserIsAdmin as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue(true);

      const store = {
        dispatch: dispatch as Dispatch,
        getState,
      } as MiddlewareAPI;

      // Act
      await middleware(store)(next)({ type: loginUser.fulfilled.type });

      // Assert
      expect(selectIsLoggedIn).toHaveBeenCalled();
      expect(selectUserIsAdmin).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(expect.any(Function));
      expect(dispatch.mock.calls[0][0].toString()).toBe(
        fetchAllRoles().toString()
      );
    });

    it('nie powinien wywołać fetchAllRoles gdy użytkownik nie jest adminem', async () => {
      // Arrange
      (selectIsLoggedIn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        true
      );
      (
        selectUserIsAdmin as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue(false);

      const store = {
        dispatch: dispatch as Dispatch,
        getState,
      } as MiddlewareAPI;

      // Act
      await middleware(store)(next)({ type: loginUser.fulfilled.type });

      // Assert
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('nie powinien wywołać fetchAllRoles gdy użytkownik nie jest zalogowany', async () => {
      // Arrange
      (selectIsLoggedIn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        false
      );
      (
        selectUserIsAdmin as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue(true);

      const store = {
        dispatch: dispatch as Dispatch,
        getState,
      } as MiddlewareAPI;

      // Act
      await middleware(store)(next)({ type: loginUser.fulfilled.type });

      // Assert
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('fetchAllRoles.fulfilled listener', () => {
    it('powinien wywołać fetchAllUsers gdy użytkownik jest adminem', async () => {
      // Arrange
      (
        selectUserIsAdmin as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue(true);

      const store = {
        dispatch: dispatch as Dispatch,
        getState,
      } as MiddlewareAPI;

      // Act
      await middleware(store)(next)({ type: fetchAllRoles.fulfilled.type });

      // Assert
      expect(selectUserIsAdmin).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(expect.any(Function));
      expect(dispatch.mock.calls[0][0].toString()).toBe(
        fetchAllUsers().toString()
      );
    });

    it('nie powinien wywołać fetchAllUsers gdy użytkownik nie jest adminem', async () => {
      // Arrange
      (
        selectUserIsAdmin as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue(false);

      const store = {
        dispatch: dispatch as Dispatch,
        getState,
      } as MiddlewareAPI;

      // Act
      await middleware(store)(next)({ type: fetchAllRoles.fulfilled.type });

      // Assert
      expect(selectUserIsAdmin).toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('inne akcje', () => {
    it('nie powinien reagować na niezwiązane akcje', async () => {
      // Arrange
      const store = {
        dispatch: dispatch as Dispatch,
        getState,
      } as MiddlewareAPI;

      // Act
      await middleware(store)(next)({ type: 'UNRELATED_ACTION' });

      // Assert
      expect(dispatch).not.toHaveBeenCalled();
      expect(selectIsLoggedIn).not.toHaveBeenCalled();
      expect(selectUserIsAdmin).not.toHaveBeenCalled();
    });
  });
});
