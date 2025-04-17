import { useDispatch, useSelector } from 'react-redux';
import { selectAppTitle } from './redux/app/app.selectors';
import { initializeApp } from './redux/app/app.reducer';
import { AppDispatch } from './redux/store';
import { useEffect } from 'react';

function App() {
  const appTitle = useSelector(selectAppTitle);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(initializeApp());
  }, [dispatch]);

  return (
    <>
      <h1>{appTitle}</h1>
    </>
  );
}

export default App;
