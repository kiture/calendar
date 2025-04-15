import { useDispatch, useSelector } from 'react-redux';
import { selectAppTitle } from './redux/app/app.selectors';
import { fetchUser } from './redux/app/app.reducer';
import { AppDispatch } from './redux/store';
import { useEffect } from 'react';

function App() {
  const appTitle = useSelector(selectAppTitle);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    
  }, []);

  return (
    <>
      <p className="text-3xl font-bold underline">{appTitle}</p>
      <button
        onClick={() =>
          dispatch(fetchUser({ name: 'John', password: '123456' }))
        }
      >
        Fetch User
      </button>
    </>
  );
}

export default App;
